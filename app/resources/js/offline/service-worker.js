import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
	clearAllData,
	createOfflineFetchHandler,
	getRouteList,
	getRefreshOptions,
	refreshAllExpired,
} from './inertia/index.js';

const SW_VERSION = '2026-03-29-offline-fetch-pipeline-v1'
const handleOfflineFetch = createOfflineFetchHandler();

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

// intercept requests made by the frontend
self.addEventListener('fetch', (event) => {
	handleOfflineFetch(event);
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