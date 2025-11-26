import { db } from './db.js'

// Keep SW alive for async work
self.addEventListener('install', (event) => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

/**
 * Fetch handler: returns cached TTL-managed data for Inertia routes.
 */
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url)

	// Only intercept API/inertia calls
	if (!url.pathname.startsWith('/inertia/')) {
		return
	}

	event.respondWith((async () => {
		const cached = await db.pages.get(url.toString())
		if (!cached) {
			// Not in DB — fetch + store
			return fetchAndStore(url.toString())
		}

		// Return stale data immediately
		const body = new Response(JSON.stringify(cached.data), {
			headers: { 'Content-Type': 'application/json' }
		})

		// Kick off a background refresh if TTL exceeded
		const expired =
			Date.now() - cached.fetched_at > cached.ttl * 1000

		if (expired) {
			event.waitUntil(fetchAndStore(url.toString()))
		}

		return body
	})())
})

/**
 * Fetch & store Inertia pages
 */
async function fetchAndStore(url) {
	const res = await fetch(url)
	const json = await res.json()

	// Look at headers or route meta returned by backend
	const ttl = parseInt(res.headers.get('X-Inertia-TTL') ?? '300')

	await db.pages.put({
		url,
		data: json,
		ttl,
		fetched_at: Date.now()
	})

	return new Response(JSON.stringify(json), {
		headers: { 'Content-Type': 'application/json' }
	})
}

/**
 * Message handling (manual sync, debugging, forced refresh)
 */
self.addEventListener('message', async (event) => {
	const { type } = event.data

	if (type === 'sync-all') {
		await fullSync()
	}
})

/**
 * Background Sync API (if available)
 */
self.addEventListener('periodicsync', (event) => {
	if (event.tag === 'offline-sync') {
		event.waitUntil(fullSync())
	}
})

async function fullSync() {
	const pages = await db.pages.toArray()

	for (const page of pages) {
		const expired =
			Date.now() - page.fetched_at > page.ttl * 1000

		if (expired) {
			await fetchAndStore(page.url)
		}
	}
}