import { db } from './db.js';
import { ROUTE_META_PATH } from './constants.js';
import { getResponseEtag, logDebug, logWarn } from './utils.js';

/**
 * Checks if a route is cacheable.
 * @param {string} url - The URL of the route.
 * @returns {Promise<boolean>} A promise that resolves to true if the route is cacheable, false otherwise.
 */
export async function isCachable(url) {
	const route = await db.routeMeta.get(url);
	return !!route;
}

/**
 * Retrieves the list of routes, optionally forcing a refresh.
 * @param {boolean} [forceRefresh=false] - Whether to force a refresh of the route list.
 * @returns {Promise<Array>} A promise that resolves to the list of routes.
 */
export async function getRouteList(forceRefresh = false) {
	try {
		// get timestamps
		const meta = await db.system.get('routeListFetchedAt');
		const ttlMeta = await db.system.get('routeListTTL');
		const now = Date.now();

		// if we have a recent route list and we're not forcing a refresh, return the cached list
		if (!forceRefresh && meta && meta.value && ttlMeta && ttlMeta.value) {
			const age = now - meta.value;
			const ttlMs = ttlMeta.value * 1000;
			if (age < ttlMs) {
				return await db.routeMeta.toArray();
			}
		}

		// build headers for conditional request using ETag if we have it
		const routeListEtag = await db.system.get('routeListETag');
		const headers = {};
		if (routeListEtag?.value) {
			headers['If-None-Match'] = routeListEtag.value;
		}

		// fetch the route list from the server
		const routeRes = await fetch(ROUTE_META_PATH, {
			credentials: 'include',
			headers,
		});

		// if we get a 304 Not Modified, we can just update the fetched timestamp and return the cached list
		if (routeRes.status === 304) {
			await db.system.put({ key: 'routeListFetchedAt', value: now });
			logDebug('Route list not modified');
			return await db.routeMeta.toArray();
		}

		// can't do anything without a successful response
		if (!routeRes.ok) {
			logWarn('Failed to fetch route list', routeRes.statusText);
			return [];
		}

		// parse the response
		const response = await routeRes.json();
		const { ttl, routes } = response;

		// update the cached route list and metadata
		await db.routeMeta.clear();
		for (const r of routes) {
			await db.routeMeta.put({
				url: r.url,
				paginated: r.paginated,
				ttl: r.ttl,
			});
		}

		// store the timestamps and ETag
		await db.system.put({ key: 'routeListFetchedAt', value: now });
		await db.system.put({ key: 'routeListTTL', value: ttl || 0 });
		const etag = getResponseEtag(routeRes);
		if (etag) {
			await db.system.put({ key: 'routeListETag', value: etag });
		} else {
			await db.system.delete('routeListETag');
		}

		return routes;
	} catch (err) {
		logWarn('getRouteList failed', err);
		return [];
	}
}
