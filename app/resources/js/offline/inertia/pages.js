import { db } from './db.js';

/**
 * Stores an inertia page for offline use in the database.
 * @param {Object} data - The page data to store.
 * @param {Object} metadata - Additional metadata for the page.
 * @param {string} metadata.etag - The ETag header value from the network response, if available, for cache validation.
 * @param {number} metadata.savedAt - The timestamp when the page was saved, used for cache expiration logic.
 * @returns {Promise<void>} A promise that resolves when the page has been stored.
 */
export async function storePage(data, metadata = {}) {
	await db.pages.put({
		url: data.url,
		component: data.component ?? null,
		props: data.props ?? null,
		version: data.version ?? null,
		savedAt: metadata.savedAt ?? Date.now(),
		etag: metadata.etag ?? null,
	});
	console.debug('[Inertia Offline] Stored offline page', data.url);
}

/**
 * Updates the timestamp of an existing offline inertia page to reflect a
 * recent refresh check that confirmed the data has not changed on the server.
 * @param {string} url - The URL of the page to update.
 * @param {number} savedAt - The timestamp to set for the page, defaults to the current time.
 * @returns {Promise<void>} A promise that resolves when the page timestamp has been updated.
 */
export async function touchPage(url, savedAt = Date.now()) {
	await db.pages.update(url, { savedAt });
	console.debug('[Inertia Offline] Refreshed offline page timestamp', url);
}

/**
 * Retrieves an offline inertia page from the database.
 * @param {string} url - The URL of the page to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves with the page data, or null if not found.
 */
export async function getPage(url) {
	return await db.pages.get(url);
}
