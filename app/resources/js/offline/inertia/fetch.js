import { getCachedPageResponse, getOfflineNavigationResponse } from './responses.js';
import { getRootRedirectResponse, maybeRecordRootRedirect } from './redirects.js';
import { isCachableSync } from './routes.js';
import { storePage } from './pages.js';
import { logDebug, logWarn } from './utils.js';

const DEFAULT_OFFLINE_FALLBACK_STATUSES = new Set([502, 503, 504]);

/**
 * Builds an app-agnostic HTML page shown by Inertia's error overlay on a cache miss.
 * @param {object} context The classified request context.
 * @returns {string} HTML string.
 */
function defaultBuildOfflineHtml(context) {
	const path = context?.path || '/';
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
	<div class="icon">&#9889;</div>
	<h1>You\'re Offline</h1>
	<p>This page is not available offline. Please check your connection and try again.</p>
	<p class="path">${path}</p>
</div>
</body>
</html>`;
}

/**
 * Classifies a request and returns a context object for the fetch pipeline,
 * including built-in eligibility flags used by the handler.
 * @param {FetchEvent} event
 * @returns {object}
 */
function classifyRequest(event) {
	const request = event.request;
	const requestUrl = new URL(request.url);
	const path = requestUrl.href.replace(requestUrl.origin, '');
	const sameOrigin = requestUrl.origin === self.location.origin;
	const isGet = request.method === 'GET';
	const accept = request.headers.get('Accept') || '';
	const xrw = (request.headers.get('X-Requested-With') || '').toLowerCase();

	const inertia = request.headers.get('X-Inertia') === 'true';
	const navigation = !inertia && (request.mode === 'navigate' || accept.includes('text/html'));
	const xhrLike = !inertia && !navigation && (
		xrw === 'xmlhttprequest'
		|| (accept.includes('application/json') && !accept.includes('text/html'))
	);
	const cacheable = !inertia || isCachableSync(path);
	const builtInInertia = sameOrigin && isGet && inertia;
	const builtInNavigation = sameOrigin && isGet && navigation;
	const builtInXhrLike = sameOrigin && isGet && xhrLike;
	const builtInEligible = builtInInertia || builtInNavigation || builtInXhrLike;

	const classification = {
		event,
		request,
		requestUrl,
		path,
		sameOrigin,
		isGet,
		cacheable,
		inertia,
		navigation,
		xhrLike,
		builtInInertia,
		builtInNavigation,
		builtInXhrLike,
		builtInEligible,
	};

	logDebug('Request classified', classification);

	return classification;
}

/**
 * Builds a generic offline fallback HTML response for Inertia requests, which
 * is used when we have no cached page data to show. This is a last-resort
 * fallback, and the content can be customized by passing a `buildOfflineHtml`
 * function to `createOfflineFetchHandler`.
 * @param {object} context The classified request context.
 * @param {function} buildOfflineHtml The function to generate the HTML content.
 * @returns {Response}
 */
function buildOfflineHtmlResponse(context, buildOfflineHtml) {
	return new Response(buildOfflineHtml(context), {
		status: 503,
		statusText: 'Service Unavailable',
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}

/**
 * Handles offline responses by attempting to serve cached pages or root redirects.
 * @param {object} context The classified request context.
 * @param {object} options The options for handling offline responses.
 * @param {function} options.buildOfflineHtml Function to build the offline HTML response.
 * @returns {Promise<Response>}
 */
async function handleOfflineResponse(context, options) {
	const { path } = context;
	const { buildOfflineHtml } = options;

	// for the root path, first check if we have a cached root redirect
	// response before falling back to the generic offline page
	if (path === '/') {
		logDebug('Handling offline response for root path, checking for root redirect');
		try {
			const redirectRes = await getRootRedirectResponse(path, true);
			if (redirectRes) {
				logDebug('Serving root redirect response for offline request', { target: redirectRes.headers.get('X-Inertia-Location') });
				return redirectRes;
			}
			logDebug('No root redirect response found for offline request, falling back to generic offline page');
		} catch (err) {
			logWarn('Failed to get root redirect response', err);
		}
	}

	// try to get a cached page response
	try {
		const cachedRes = await getCachedPageResponse(path);
		if (cachedRes) {
			logDebug('Serving cached page response for offline request', { path });
			return cachedRes;
		}
		logDebug('No cached page response found for offline request', { path });
	} catch (err) {
		logWarn('Failed to get cached page response', err);
	}

	// no cached page, serve the generic offline HTML response
	logDebug('Serving generic offline HTML response', { path });
	return buildOfflineHtmlResponse(context, buildOfflineHtml);
}

/**
 * The main fetch handler for Inertia requests, which implements the offline
 * caching and fallback logic. The general flow is:
 * 1) Try the network first.
 * 2) If the network fails or returns an offline fallback status, try to serve a cached page.
 * 3) If no cached page, serve a generic offline HTML response.
 * @param {object} context The classified request context.
 * @param {FetchEvent} context.event The original fetch event.
 * @param {Request} context.request The fetch request.
 * @param {string} context.path The request path.
 * @param {object} options The fetch handler options.
 * @param {Set<number>} options.offlineFallbackStatuses The set of HTTP statuses that should trigger the offline fallback.
 * @param {function} options.buildOfflineHtml The function to generate the offline HTML content.
 * @returns {Promise<Response>}
 */
async function handleInertiaFetch(context, options) {
	// extract context and options
	const { event, request, path } = context;
	const { offlineFallbackStatuses } = options;
	logDebug('Handling Inertia fetch', { path });

	try {
		// make the network request
		const networkRes = await fetch(request);

		// record root redirect if applicable
		event.waitUntil(maybeRecordRootRedirect(path, networkRes));

		// handle HTTP errors that should trigger the offline fallback
		if (offlineFallbackStatuses.has(networkRes.status)) {
			logDebug('Network response has offline fallback status, handling offline response', { status: networkRes.status, path });
			return await handleOfflineResponse(context, options);
		}

		// if we got a successful response, update the cache in the background for next time
		if (networkRes.status === 200 && context.cacheable) {
			logDebug('Network response successful, updating cache in the background', { path });

			event.waitUntil((async () => {
				try {
					const data = await networkRes.clone().json();
					await storePage(data, { etag: networkRes.headers.get('ETag') });
				} catch (err) {
						logWarn('Failed to store page data', err);
				}
			})());
		}

		return networkRes;
	} catch (err) {
		// network request failed, likely offline
		logWarn('[Service Worker] Network request failed:', path, err);
		return await handleOfflineResponse(context, options);
	}
}

/**
 * Runs custom fetch handlers in sequence, allowing them to return a Response
 * or defer to the next handler.
 * @param {*} context The classified request context.
 * @param {*} options The fetch handler options.
 * @returns {Promise<Response|null>}
 */
async function runCustomHandlers(context, options) {
	// extract custom handlers, early return if none configured
	const { customHandlers } = options;
	if (!Array.isArray(customHandlers) || customHandlers.length === 0) {
		logDebug('No custom fetch handlers configured');
		return null;
	}

	// run handlers in sequence, returning the first Response we get
	for (const handler of customHandlers) {
		// skip invalid handlers
		if (typeof handler !== 'function') {
			logDebug('Skipping invalid custom fetch handler', { handler });
			continue;
		}

		try {
			// handlers can return a Response or a Promise that resolves to a
			// Response, or null/undefined to defer
			logDebug('Running custom fetch handler', { handler });
			const response = await handler({
				...context,
				waitUntil: (promise) => context.event.waitUntil(promise),
			});
			if (response instanceof Response) {
				return response;
			}
		} catch (err) {
			logWarn('[Service Worker] Custom fetch handler failed', err);
		}
	}

	// no handler returned a Response
	logDebug('No custom fetch handler returned a response');
	return null;
}

/**
 * Handles navigation fetch requests, implementing offline fallback logic.
 * @param {*} context The classified request context.
 * @param {*} options The fetch handler options.
 * @returns {Promise<Response>}
 */
async function handleNavigationFetch(context, options) {
	// extract context and options
	const { request, path } = context;
	const { offlineFallbackStatuses, buildOfflineHtml } = options;
	logDebug('Handling navigation fetch', { path });

	try {
		// make the network request
		const networkRes = await fetch(request);

		// handle HTTP errors that should trigger the offline fallback
		if (offlineFallbackStatuses.has(networkRes.status)) {
			logDebug('Network response has offline fallback status, handling offline response', { status: networkRes.status, path });
			const offlineHtmlRes = await getOfflineNavigationResponse(path);
			if (offlineHtmlRes) {
				return offlineHtmlRes;
			}
			logDebug('No cached offline navigation response found, passing through network response', { path });
		}

		// pass through the network response
		return networkRes;
	} catch (err) {
		// network request failed, likely offline
		logWarn('[Service Worker] Network request failed:', path, err);

		// try to serve a cached offline navigation response
		logDebug('Attempting to serve cached offline navigation response', { path });
		const offlineHtmlRes = await getOfflineNavigationResponse(path);
		if (offlineHtmlRes) {
			return offlineHtmlRes;
		}

		// no cached offline response, serve the generic offline HTML response
		logDebug('No cached offline navigation response found, serving generic offline HTML response', { path });
		return buildOfflineHtmlResponse(context, buildOfflineHtml);
	}
}

/**
 * Handles XHR-like fetch requests, implementing offline fallback logic.
 * @param {*} context The classified request context.
 * @param {*} options The fetch handler options.
 * @returns {Promise<Response>}
 */
async function handleXhrLikeFetch(context, options) {
	// extract context and options
	const { request, path } = context;
	logDebug('Handling XHR-like fetch', { path });

	try {
		// try the network request
		return await fetch(request);
	} catch (err) {
		// network request failed, likely offline
		logWarn('[Service Worker] Network request failed:', path, err);
		return new Response('', {
			status: 503,
			statusText: 'Service Unavailable',
			headers: { 'Content-Type': 'text/plain' },
		});
	}
}

/**
 * Creates a fetch event handler with an extension slot between built-in
 * Inertia handling and generic navigation/XHR fallbacks.
 *
 * @param {Object} [userOptions]
 * @param {Set<number>} [userOptions.offlineFallbackStatuses]
 * @param {(context: object) => string} [userOptions.buildOfflineHtml]
 * @param {Array<(context: object) => Promise<Response|null>|Response|null>} [userOptions.customHandlers]
 * @returns {(event: FetchEvent) => boolean}
 */
export function createOfflineFetchHandler(userOptions = {}) {
	// set up options with defaults
	const options = {
		offlineFallbackStatuses: userOptions.offlineFallbackStatuses || DEFAULT_OFFLINE_FALLBACK_STATUSES,
		buildOfflineHtml: userOptions.buildOfflineHtml || defaultBuildOfflineHtml,
		customHandlers: userOptions.customHandlers || [],
	};
	logDebug('Offline fetch handler created with options', options);

	return function handleOfflineFetchEvent(event) {
		logDebug('Fetch event received', { method: event.request.method, url: event.request.url });

		// classify the request
		const context = classifyRequest(event);
		const hasCustomHandlers = Array.isArray(options.customHandlers) && options.customHandlers.length > 0;

		// don't intercept when no built-in policies match and no custom handlers exist
		if (!context.builtInEligible && !hasCustomHandlers) {
			logDebug('Request not eligible for built-in handling and no custom handlers configured, skipping', { path: context.path });
			return false;
		}

		event.respondWith((async () => {
			// handle Inertia requests
			if (context.builtInInertia) {
				return handleInertiaFetch(context, options);
			}

			// run custom handlers
			const customResponse = await runCustomHandlers(context, options);
			if (customResponse) {
				return customResponse;
			}

			// handle navigation requests
			if (context.builtInNavigation) {
				return handleNavigationFetch(context, options);
			}

			// handle non-Inertia XHR-like requests
			if (context.builtInXhrLike) {
				return handleXhrLikeFetch(context, options);
			}

			// fallback to normal request
			logDebug('No handlers returned a response, falling back to network', { path: context.path });
			return fetch(context.request);
		})());

		return true;
	};
}
