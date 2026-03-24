import { precacheAndRoute } from 'workbox-precaching'
import { clearAllData, getPage, isCachable, refreshAllExpired, storePage } from './inertia-offline.js';

const SW_VERSION = '2026-03-23-network-error-fallback-v1'
const OFFLINE_FALLBACK_STATUSES = new Set([502, 503, 504])

console.info('[Service Worker] Loaded', {
	version: SW_VERSION,
	scope: self.registration?.scope,
	scriptURL: self.location?.href,
})

// This is injected by vite-plugin-pwa at build time
// DO NOT touch at runtime
precacheAndRoute(self.__WB_MANIFEST || [])

async function getCachedPageResponse(path) {
	const rec = await getPage(path)
	if (!rec) {
		return null
	}

	console.log('[Service Worker] Serving from cache:', path)
	return new Response(JSON.stringify({
		url: rec.url,
		component: rec.component,
		props: {
			...rec.props,

			// inject offline indicators
			_offline: true,
			_savedAt: rec.savedAt,
		},
		version: rec.version,
	}), {
		headers: {
			'Content-Type': 'application/json',
			'X-Inertia': 'true',
		},
	})
}

// take control of all unclaimed clients/pages immediately
self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		await self.clients.claim()
		console.info('[Service Worker] Activated', {
			version: SW_VERSION,
			scope: self.registration?.scope,
			scriptURL: self.location?.href,
		})
	})())
})

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

	// only handle inertia `get` requests
	if (req.headers.get('X-Inertia') !== 'true' || req.method !== 'GET') {
		console.log('[Service Worker] Not an Inertia GET request, skipping:', path);
		return;
	}

	// override the processing of the request
	event.respondWith((async () => {
		// check if this request is cacheable
		const isCacheable = await isCachable(path);
		if (!isCacheable) {
			console.log('[Service Worker] Route not marked as cacheable, skipping:', path);
			return fetch(req);
		}

		try {
			// make the original request
			console.log('[Service Worker] Fetching from network:', path);
			const networkRes = await fetch(req);

			if (OFFLINE_FALLBACK_STATUSES.has(networkRes.status)) {
				console.warn('[Service Worker] Server unavailable response, attempting to serve from cache:', path, networkRes.status)
				const cachedRes = await getCachedPageResponse(path)
				if (cachedRes) {
					return cachedRes
				}

				console.warn('[Service Worker] No cache available for unavailable server response, passing through:', path, networkRes.status)
			}

			// check the response code
			if (networkRes && networkRes.status === 200) {
				console.log('[Service Worker] Successful network response, caching page in background:', path);
				event.waitUntil((async () => {
					try {
						const data = await networkRes.clone().json();
						await storePage(data);
					} catch (err) {
						// non-json or store error
						console.warn('Failed to store page data', err);
					}
				})());
			}

			// pass through the network response
			return networkRes;
		} catch (err) {
			// network failure; try to serve from cache
			console.warn('[Service Worker] Network request failed, attempting to serve from cache:', path, err);
			const cachedRes = await getCachedPageResponse(path)
			if (cachedRes) {
				return cachedRes
			}

			// no cache; return offline response
			console.warn('[Service Worker] No cache available, returning offline response:', path);
			return new Response('Uh oh! This page or action does not have offline support.', { status: 503, statusText: 'offline' });
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
			event.waitUntil(refreshAllExpired());
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
		event.waitUntil(refreshAllExpired());
	}
});

// push handler
self.addEventListener('push', (event) => {
	const data = event.data && event.data.json ? event.data.json() : {};

	// refresh trigger
	if (data?.type === 'refresh-offline') {
		event.waitUntil(refreshAllExpired());
	}
});