import { db } from './db.js';

/**
 * Clears all offline data, including route metadata, cached pages, and system
 * records like the Inertia version and root redirects. This is typically
 * called when a change in the Inertia version is detected to ensure that stale
 * data does not cause issues with the updated frontend.
 */
export async function clearAllData() {
	await Promise.all([
		db.routeMeta.clear(),
		db.pages.clear(),
		db.system.clear(),
	]);
	console.debug('[Inertia Offline] Cleared all offline data');
}
