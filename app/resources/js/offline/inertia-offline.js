import { db } from "./db";

const ROUTE_META_TTL = 86400000; // 1 day
const ROUTE_META_PATH = '/meta/offline-cache'; // backend endpoint to fetch route list
const ROUTE_VERSION_PATH = '/meta/offline-version'; // backend endpoint to fetch inertia version

const REFRESH_CONCURRENCY = 4; // number of concurrent requests
const REFRESH_STAGGER = 500; // ms between requests to reduce burst

/**
 * How often to check for local pages that need refreshing
 */
export const REFRESH_INTERVAL = 900000; // 15 minutes

/**
 * Stores an inertia page in the DB
 * @param {object} data The inertia page data
 * @returns {Promise<void>}
 */
export async function storePage(data) {
	await db.pages.put({
		url: data.url,
		component: data.component ?? null,
		props: data.props ?? null,
		version: data.version ?? null,
		savedAt: Date.now(),
	});
	console.debug('Stored offline page', data.url);
}

/**
 * Fetches the list of cacheable routes from the local DB, updating from backend if needed
 * @returns {Promise<Array>} The list of cacheable routes
 */
export async function getRouteList() {
	try {
		// check if we need to refresh the route list
		const meta = await db.system.get('routeListFetchedAt');
		const now = Date.now();
		if (meta && meta.value) {
			const age = now - meta.value;
			if (age < ROUTE_META_TTL) {
				// still fresh; return existing list
				return await db.routeMeta.toArray();
			}
		}

		// get list of cacheable routes from backend
		const routeRes = await fetch(ROUTE_META_PATH, { credentials: 'include' });
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
				ttl: r.ttl * 1000, // convert to ms
			});
		}

		// update fetch time
		await db.system.put({ key: 'routeListFetchedAt', value: now });

		// return the new list
		return list;
	} catch (err) {
		console.warn('getRouteList failed', err);
		return [];
	}
}

/**
 * Fetches the local inertia version from the DB
 * @returns {Promise<string|null>} The local inertia version or null if not set
 */
export async function getLocalInertiaVersion() {
	const rec = await db.system.get('inertiaVersion');
	return rec ? rec.value : null;
}

/**
 * Fetches the remote inertia version from the backend and updates local DB
 * @returns {Promise<string|null>} The remote inertia version or null on failure
 */
export async function getRemoteInertiaVersion() {
	try {
		// get current version
		const res = await fetch(ROUTE_VERSION_PATH, { credentials: 'include' });
		if (!res.ok) {
			console.warn('Failed to fetch inertia version', res.statusText);
			return null;
		}
		
		// update version in system table
		const data = await res.json();
		await db.system.put({ key: 'inertiaVersion', value: data.version });

		return data.version || null;
	} catch (err) {
		console.warn('getInertiaVersion failed', err);
		return null;
	}
}

/**
 * Fetches a page from the local DB
 * @param {string} url The URL of the page to fetch
 * @returns {Promise<Object|null>} The page data or null if not found
 */
export async function getPage(url) {
	return await db.pages.get(url);
}

/**
 * Refresh all expired cached pages based on routeMeta TTLs
 * @returns {Promise<void>}
 */
export async function refreshAllExpired() {
	try {
		// get list of cacheable routes
		const list = await getRouteList();

		// build list of pages that need refreshing
		const toRefresh = [];
		for (const route of list) {
			const rec = await db.pages.get(route.url);
			if (!rec) {
				// not cached yet
				toRefresh.push(route);
			} else if (route.ttl) {
				// check if expired
				const isExpired = (rec.savedAt + route.ttl) < Date.now();
				if (isExpired) {
					toRefresh.push(route);
				}
			}
		}

		// return early if there's nothing to refresh
		if (toRefresh.length === 0) {
			console.debug('No pages to refresh');
			return;
		}

		// start with one page in case we need to cache bust
		const firstPage = toRefresh.pop();
		await cachePage(firstPage.url);

		// fetch every route (bounded concurrency to avoid spikes)
		const active = [];
		for (const item of toRefresh) {
			const p = (async () => {
				await cachePage(item.url);
				await new Promise(r => setTimeout(r, REFRESH_STAGGER));
			})();
			active.push(p);
			if (active.length >= REFRESH_CONCURRENCY) {
				// wait for one to complete, ignoring errors
				await Promise.race(active).catch(()=>{});

				// remove settled
				for (let i = active.length - 1; i >= 0; i--) {
					if (active[i].isFulfilled || active[i].isRejected) active.splice(i,1);
				}
			}
		}

		// wait for all workers to complete
		await Promise.all(active);
	} catch (err) {
		console.warn('refreshAllExpired failed', err);
	}
}

/**
 * Caches a page by fetching it from the backend and storing in the DB
 * @param {string} url The URL of the page to cache
 * @returns {Promise<void>}
 */
export async function cachePage(url) {
	try {
		// get local inertia version
		const localVersion = await getLocalInertiaVersion();

		// make the inertia-like request
		const res = await fetch(url, {
			headers: {
				'X-Inertia': 'true',
				'X-Inertia-Version': localVersion || '',
				'X-Requested-With': 'XMLHttpRequest',
				'Accept': 'application/json',
			},
			credentials: 'include',
		});
		if (!res.ok) {
			// check for 409 version mismatch
			if (res.status === 409) {
				console.warn('Version mismatch detected for offline page. Need to cache bust. Rebuild will happen on next refresh.', url);
				await cacheBust();
				await cachePage(url); // retry once
			} else {
				console.warn('Failed to fetch offline page for caching', url, res.statusText);
			}
			return;
		}

		// update the local db
		const data = await res.json();
		await storePage(data);
	} catch (err) {
		console.warn('Failed to cache offline page', url, err);
	}
}

/**
 * Clears all offline data and rebuilds the cache from scratch
 * @returns {Promise<void>}
 */
export async function cacheBust() {
	try {
		// clear all existing data
		await clearAllData();

		// fetch new inertia version
		await getRemoteInertiaVersion();
	} catch (err) {
		console.warn('cacheBust failed', err);
	}
}

/**
 * Clears all offline data from the DB
 * @returns {Promise<void>}
 */
export async function clearAllData() {
	await Promise.all([
		db.routeMeta.clear(),
		db.pages.clear(),
		db.system.clear(),
	]);
	console.debug('Cleared all offline data');
}

/**
 * Starts a periodic refresh cycle to refresh expired pages
 * @param {number} intervalMs Interval in milliseconds between refresh cycles. Default is 5 minutes.
 * @returns {Function} A function to stop the refresh cycle
 */
export async function startRefreshCycle(intervalMs = REFRESH_INTERVAL) {
	// run once now
	if (navigator.onLine) {
		console.debug('Running offline refresh cycle');
		await refreshAllExpired();
	}

	// then run periodic timer while app stays open
	const id = setInterval(async () => {
		// only run when online
		if (navigator.onLine) {
			console.debug('Running offline refresh cycle');
			await refreshAllExpired();
		}
	}, intervalMs);

	return () => clearInterval(id); // returns stop function
}