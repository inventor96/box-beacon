import { db } from './db.js'
import { clearAllData, refreshAllExpired, storePage } from './inertia-offline.js';

// keep service worker alive for async work
self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

// take control of all unclaimed clients/pages immediately
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// intercept requests made by the frontend
self.addEventListener('fetch', async (event) => {
	const req = event.request;

	// only handle inertia `get` requests
	if (req.headers.get('X-Inertia') !== 'true' || req.method !== 'GET') {
		return;
	}

	// check if this request is cacheable
	const isCacheable = await db.routeMeta.get(req.url);
	if (!isCacheable) {
		return;
	}

	// override the processing of the request
	event.respondWith((async () => {
		try {
			// make the original request
			const networkRes = await fetch(req);

			// check the response code
			if (networkRes && networkRes.status === 200) {
				try {
					// store the response
					const data = await networkRes.clone().json();
					await storePage(data);
				} catch (err) {
					// non-json or store error
					console.warn('Failed to store page data', err);
				}
			}

			// pass through the network response
			return networkRes;
		} catch (err) {
			// network failure; try to serve from cache
			const rec = await db.pages.get(req.url);
			if (rec) {
				// synthesize a response
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
				});
			}

			// no cache; return offline response
			return new Response('Uh oh! This page or action does not have offline support.', { status: 503, statusText: 'offline' });
		}
	})());
});

// listen for messages from frontend
self.addEventListener('message', (event) => {
	const data = event.data || {};

	// remove the stored data (e.g. logout)
	if (data.type === 'CLEAR_OFFLINE') {
		event.waitUntil(clearAllData());
	}

	// refresh all expired pages
	if (data.type === 'REFRESH_EXPIRED') {
		event.waitUntil(refreshAllExpired());
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