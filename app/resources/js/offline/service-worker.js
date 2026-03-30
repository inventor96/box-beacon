import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { createOfflineFetchHandler, createOfflineMaintenanceHandlers } from './inertia/index.ts';

const handleOfflineFetch = createOfflineFetchHandler();
const {
	warmRouteCacheabilityIndex,
	handleMessageEvent,
	handlePeriodicSyncEvent,
	handlePushEvent
} = createOfflineMaintenanceHandlers();

// clean up old precaches automatically
cleanupOutdatedCaches()

// This is injected by vite-plugin-pwa at build time
// DO NOT touch at runtime
precacheAndRoute(self.__WB_MANIFEST || [])

// take control of all unclaimed clients/pages immediately
self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		await warmRouteCacheabilityIndex()
		await self.clients.claim()
	})())
})

// intercept requests made by the frontend
self.addEventListener('fetch', (event) => {
	handleOfflineFetch(event);
});

// listen for messages from frontend
self.addEventListener('message', (event) => {
	const { type } = event.data || {};
	if (type === 'SKIP_WAITING') {
		// custom skip waiting trigger (e.g. from Inertia page reload when a new version is detected)
		self.skipWaiting();
		return;
	}

	handleMessageEvent(event);
});

// periodic sync handler (chrome / android pwa)
self.addEventListener('periodicsync', (event) => {
	handlePeriodicSyncEvent(event);
});

// push handler
self.addEventListener('push', (event) => {
	handlePushEvent(event);
});