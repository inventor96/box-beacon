import Dexie from 'dexie';

export const db = new Dexie('InertiaOfflineDB');

db.version(1).stores({
	pages: '&url, savedAt, expiresAt',      // url is primary key
	routeMeta: '&url, ttl'                  // routes provided by backend
});