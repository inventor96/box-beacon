import Dexie from 'dexie';

/**
 * Database for storing offline Inertia pages
 */
export const db = new Dexie('InertiaOfflineDB');

db.version(3).stores({
	// individual page data
	pages: '&url, component, props, version, savedAt, etag',

	// list of routes to cache
	routeMeta: '&url, paginated, ttl',

	// system info (e.g. last sync time, last route list fetch)
	system: '&key, value',
});