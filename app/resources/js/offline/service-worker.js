import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
	createOfflineFetchHandler,
	createOfflineMaintenanceHandlers,
} from './inertia/index.js';

const SW_VERSION = '2026-03-29-offline-fetch-pipeline-v1'
const handleOfflineFetch = createOfflineFetchHandler();
const maintenanceHandlers = createOfflineMaintenanceHandlers();

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
		await maintenanceHandlers.warmRouteCacheabilityIndex()
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
	const { type } = event.data || {};
	console.log('[Service Worker] Message received:', event);

	if (type === 'SKIP_WAITING') {
		// custom skip waiting trigger (e.g. from Inertia page reload when a new version is detected)
		self.skipWaiting();
		return;
	}

	maintenanceHandlers.handleMessageEvent(event);
});

// periodic sync handler (chrome / android pwa)
self.addEventListener('periodicsync', (event) => {
	maintenanceHandlers.handlePeriodicSyncEvent(event);
});

// push handler
self.addEventListener('push', (event) => {
	maintenanceHandlers.handlePushEvent(event);
});