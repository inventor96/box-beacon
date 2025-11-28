import { db } from './db.js'

const ROUTE_META_TTL = 86400; // 1 day in seconds

// keep service worker alive for async work
self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

// take control of all unclaimed clients/pages immediately
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// listen for messages from frontend
self.addEventListener('message', event => {
	const data = event.data || {};

	// remove the stored data (e.g. logout)
	if (data.type === 'CLEAR_OFFLINE') {
		event.waitUntil((async () => {
			await Promise.all([
				db.inertia.clear(),
				db.routeMeta.clear()
			]);
		})());
	}

	// refresh all expired pages
	if (data.type === 'REFRESH_EXPIRED') {
		event.waitUntil(refreshAllExpired());
	}
});

// intercept requests made by the frontend
self.addEventListener('fetch', event => {
	const req = event.request;

	// only handle inertia requests
	if (req.headers.get('X-Inertia') !== 'true') {
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
					// non-json or store error; ignore
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
					props: rec.props,
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

// store an inertia page in the db
async function storePage(data) {
	await db.pages.put({
		url: req.url,
		component: data.component ?? null,
		props: data.props ?? null,
		version: data.version ?? null,
		savedAt: Date.now() / 1000, // store as seconds
	});
}

// updates the list of cacheable routes if needed, and returns the list
async function refreshAndGetRouteList() {
	try {
		// check if we need to refresh the route list
		const meta = await db.system.get('routeListFetchedAt');
		const now = Date.now() / 1000;
		if (meta && meta.value) {
			const age = now - meta.value;
			if (age < ROUTE_META_TTL) {
				// still fresh; return existing list
				return await db.routeMeta.toArray();
			}
		}

		// get list of cacheable routes from backend
		const routeRes = await fetch('/meta/offline-cache', { credentials: 'include' });
		if (!routeRes.ok) {
			console.warn('Failed to fetch route list', routeRes.statusText);
			return [];
		}
		
		// store route details
		const list = await routeRes.json();
		for (const r of list) {
			await db.routeMeta.put({
				url: r.url,
				paginated: r.paginated,
				ttl: r.ttl
			});
		}

		// update fetch time
		await db.system.put({ key: 'routeListFetchedAt', value: now });

		// return the new list
		return list;
	} catch (err) {
		console.warn('refreshRouteList failed', err);
		return [];
	}
}

// refresh expired pages
async function refreshAllExpired() {
	try {
		// get list of cacheable routes
		const list = await refreshAndGetRouteList();

		// fetch every route (bounded concurrency to avoid spikes)
		const CONCURRENCY = 3;
		const queue = [...list];
		const workers = Array.from({ length: CONCURRENCY }, async () => {
			// check if there's more to process
			while (queue.length) {
				// get the next url from the queue
				const next = queue.shift();
				try {
					// check if the page is due to be updated
					const cached = await db.pages.get(next.url);
					if (cached) {
						const isExpired = (cached.savedAt + next.ttl) < (Date.now() / 1000);
						if (!isExpired) {
							// still fresh; skip
							continue;
						}
					}

					// fetch and store
					const res = await fetch(next.url, { headers: {'X-Inertia': 'true', 'Accept': 'application/json'} , credentials: 'include' });
					if (!res.ok) {
						console.warn('Failed to fetch offline page', next.url, res.statusText);
						continue;
					}
					const data = await res.json();
					await storePage(data);
				} catch (err) {
					// fetch or store error; ignore
					console.warn('Failed to refresh offline page', next.url, err);
				}
			}
		});

		// wait for all workers to complete
		await Promise.all(workers.map(w => w()));
	} catch (err) {
		console.warn('refreshAllExpired failed', err);
	}
}