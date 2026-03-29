import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
	clearAllData,
	getCachedPageResponse,
	getRouteList,
	getOfflineNavigationResponse,
	getRefreshOptions,
	getRootRedirectResponse,
	isCachableSync,
	maybeRecordRootRedirect,
	refreshAllExpired,
	storePage,
} from './inertia/index.js';

const SW_VERSION = '2026-03-28-offline-sync-cacheability-v1'
const OFFLINE_FALLBACK_STATUSES = new Set([502, 503, 504])

/**
 * Builds an app-agnostic HTML page shown by Inertia's error overlay on a cache miss.
 * @param {string} path The requested path that had no cached version.
 * @returns {string} HTML string
 */
function buildOfflineHtml(path) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Offline</title>
<style>
	* { box-sizing: border-box; margin: 0; padding: 0; }
	body {
		font-family: system-ui, -apple-system, sans-serif;
		background: #f8f9fa;
		color: #212529;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
	}
	.card {
		background: #fff;
		border: 1px solid #dee2e6;
		border-radius: 0.5rem;
		max-width: 480px;
		width: 100%;
		padding: 2rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}
	.icon { font-size: 3rem; margin-bottom: 1rem; }
	h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }
	p { color: #6c757d; line-height: 1.5; margin-bottom: 0.5rem; }
	.path { font-family: monospace; font-size: 0.85rem; color: #adb5bd; }
</style>
</head>
<body>
<div class="card">
	<div class="icon">⚡</div>
	<h1>You\'re Offline</h1>
	<p>This page is not available offline. Please check your connection and try again.</p>
	<p class="path">${path}</p>
</div>
</body>
</html>`;
}

console.info('[Service Worker] Loaded', {
	version: SW_VERSION,
	scope: self.registration?.scope,
	scriptURL: self.location?.href,
})

// clean up old precaches automatically
cleanupOutdatedCaches()

// This is injected by vite-plugin-pwa at build time
// DO NOT touch at runtime
precacheAndRoute(self.__WB_MANIFEST || [])

// take control of all unclaimed clients/pages immediately
self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		try {
			await getRouteList()
			console.info('[Service Worker] Route cacheability index warmed')
		} catch (err) {
			console.warn('[Service Worker] Failed to warm route cacheability index', err)
		}

		await self.clients.claim()
		console.info('[Service Worker] Activated', {
			version: SW_VERSION,
			scope: self.registration?.scope,
			scriptURL: self.location?.href,
		})
	})())
})

/**
 * Returns true when the request carries the Inertia header.
 * @param {Request} req
 * @returns {boolean}
 */
function isInertiaRequest(req) {
	return req.headers.get('X-Inertia') === 'true';
}

/**
 * Returns true when the browser is performing a top-level navigation or the
 * request Accept header signals an HTML response is expected.
 * @param {Request} req
 * @returns {boolean}
 */
function isNavigationRequest(req) {
	if (req.mode === 'navigate') return true;
	return (req.headers.get('Accept') || '').includes('text/html');
}

/**
 * Returns true when the request looks like a non-Inertia XHR or JSON fetch
 * (i.e. something that expects a machine-readable response, not a full page).
 * @param {Request} req
 * @returns {boolean}
 */
function isNonInertiaXhrLike(req) {
	if (isInertiaRequest(req)) return false;
	const xrw = (req.headers.get('X-Requested-With') || '').toLowerCase();
	const accept = req.headers.get('Accept') || '';
	return xrw === 'xmlhttprequest'
		|| (accept.includes('application/json') && !accept.includes('text/html'));
}

// intercept requests made by the frontend
self.addEventListener('fetch', (event) => {
	console.log('[Service Worker] Fetch event for:', event);
	const req = event.request;
	const reqUrl = new URL(req.url);
	const path = reqUrl.href.replace(reqUrl.origin, '');

	// only handle same-origin requests
	if (reqUrl.origin !== self.location.origin) {
		console.log('[Service Worker] Not a same-origin request, skipping:', path);
		return;
	}

	// only intercept GET requests
	if (req.method !== 'GET') {
		console.log('[Service Worker] Non-GET request, skipping interception:', path);
		return;
	}

	const inertia = isInertiaRequest(req);
	const navigation = !inertia && isNavigationRequest(req);
	const xhrLike = !inertia && !navigation && isNonInertiaXhrLike(req);

	// only intercept requests we have an offline policy for
	if (!inertia && !navigation && !xhrLike) {
		console.log('[Service Worker] No offline policy for request, skipping:', path);
		return;
	}

	// for Inertia requests, check if route is cacheable before intercepting
	if (inertia && !isCachableSync(path)) {
		console.log('[Service Worker] Inertia route not cacheable, skipping interception:', path);
		return;
	}

	// override the processing of the request
	console.log('[Service Worker] Inertia route cacheable, intercepting:', path);
	event.respondWith((async () => {
		try {
			// make the original request
			console.log('[Service Worker] Fetching from network:', path);
			const networkRes = await fetch(req);
			await maybeRecordRootRedirect(path, networkRes);
			
			if (inertia) {
				if (OFFLINE_FALLBACK_STATUSES.has(networkRes.status)) {
					if (path === '/') {
						const redirectRes = await getRootRedirectResponse(path, inertia);
						if (redirectRes) {
							return redirectRes;
						}
					}
					
					console.warn('[Service Worker] Server unavailable response, attempting to serve from cache:', path, networkRes.status);
					const cachedRes = await getCachedPageResponse(path);
					if (cachedRes) {
						return cachedRes;
					}

					console.warn('[Service Worker] No cache available for unavailable server response, returning offline page:', path, networkRes.status);
					return new Response(buildOfflineHtml(path), {
						status: 503,
						statusText: 'Service Unavailable',
						headers: { 'Content-Type': 'text/html; charset=utf-8' },
					});
				}

				// check the response code
				if (networkRes && networkRes.status === 200) {
					console.log('[Service Worker] Successful network response, caching page in background:', path);
					event.waitUntil((async () => {
						try {
							const data = await networkRes.clone().json();
							await maybeRecordRootRedirect(path, networkRes, data);
							await storePage(data, { etag: networkRes.headers.get('ETag') });
						} catch (err) {
							// non-json or store error
							console.warn('Failed to store page data', err);
						}
					})());
				}

				// pass through the network response
				return networkRes;
			}

			// for non-Inertia requests, just pass through the network response
			// and handle offline fallback in case of failure or unavailable server status
			if (navigation && OFFLINE_FALLBACK_STATUSES.has(networkRes.status)) {
				const offlineHtmlRes = await getOfflineNavigationResponse(path);
				if (offlineHtmlRes) {
					return offlineHtmlRes;
				}
			}

			// for all other intercepted request types, pass the request through
			return networkRes;
		} catch (err) {
			// network failure
			console.warn('[Service Worker] Network request failed:', path, err);

			if (inertia) {
				if (path === '/') {
					const redirectRes = await getRootRedirectResponse(path, inertia);
					if (redirectRes) {
						return redirectRes;
					}
				}

				// try to serve from cache
				const cachedRes = await getCachedPageResponse(path);
				if (cachedRes) {
					return cachedRes;
				}
			}

			if (xhrLike) {
				// non-Inertia XHR/fetch: return empty 503 so the caller can handle it
				console.warn('[Service Worker] Returning empty 503 for XHR-like request:', path);
				return new Response('', {
					status: 503,
					statusText: 'Service Unavailable',
					headers: { 'Content-Type': 'text/plain' },
				});
			}

			if (navigation) {
				const offlineHtmlRes = await getOfflineNavigationResponse(path);
				if (offlineHtmlRes) {
					return offlineHtmlRes;
				}
			}

			// browser-rendered requests (navigation, non-GET, uncached Inertia): return HTML 503
			console.warn('[Service Worker] No cache available, returning HTML offline response:', path);
			return new Response(buildOfflineHtml(path), {
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		}
	})());
});

// listen for messages from frontend
self.addEventListener('message', (event) => {
	const { type, payload } = event.data || {};
	console.log('[Service Worker] Message received:', event);

	switch (type) {
		// remove the stored data (e.g. logout)
		case 'CLEAR_OFFLINE':
			event.waitUntil(clearAllData());
			break;

		// refresh all expired pages
		case 'REFRESH_EXPIRED':
			event.waitUntil(refreshAllExpired(getRefreshOptions()));
			break;

		// custom skip waiting trigger (e.g. from Inertia page reload when a new version is detected)
		case 'SKIP_WAITING':
			self.skipWaiting();
			break;
	}
});

// periodic sync handler (chrome / android pwa)
self.addEventListener('periodicsync', (event) => {
	if (event.tag === 'inertia-refresh' || event.tag === 'inertia-refresh:default') {
		event.waitUntil(refreshAllExpired(getRefreshOptions()));
	}
});

// push handler
self.addEventListener('push', (event) => {
	const data = event.data && event.data.json ? event.data.json() : {};

	// refresh trigger
	if (data?.type === 'refresh-offline') {
		event.waitUntil(refreshAllExpired(getRefreshOptions()));
	}
});