import { db } from "./db";

const ROUTE_META_PATH = '/pwa/offline-routes'; // backend endpoint to fetch route list
const ROUTE_VERSION_PATH = '/pwa/offline-version'; // backend endpoint to fetch inertia version
const ROOT_REDIRECT_KEY_PREFIX = 'rootRedirect:';
export const ROOT_REDIRECT_SOURCE_PATH = '/';
export const OFFLINE_TEMPLATE_PATH = '/pwa/offline-template';
export const OFFLINE_TEMPLATE_PAGE_PLACEHOLDER = 'INERTIA_PAGE';
export const OFFLINE_TEMPLATE_SYSTEM_KEY = `offlineTemplate:v1:${OFFLINE_TEMPLATE_PATH}:${OFFLINE_TEMPLATE_PAGE_PLACEHOLDER}`;

const REFRESH_CONCURRENCY = 4; // number of concurrent requests
const REFRESH_STAGGER = 500; // ms between requests to reduce burst

function getRootRedirectSystemKey(path = '/') {
	return `${ROOT_REDIRECT_KEY_PREFIX}${path}`;
}

function escapeHtmlAttribute(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;')
}

function replaceSinglePlaceholder(templateHtml, placeholder, replacement) {
	if (typeof templateHtml !== 'string') {
		return null
	}

	const placeholderCount = templateHtml.split(placeholder).length - 1
	if (placeholderCount !== 1) {
		return null
	}

	return templateHtml.replace(placeholder, replacement)
}

export function getRefreshOptions() {
	const options = {
		templatePath: OFFLINE_TEMPLATE_PATH,
		templatePlaceholder: OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
		templateSystemKey: OFFLINE_TEMPLATE_SYSTEM_KEY,
		rootRedirectPath: ROOT_REDIRECT_SOURCE_PATH,
	}
	console.debug('[Inertia Offline] Built refresh options', options)
	return options
}

function toRelativeSameOriginPath(urlLike) {
	if (!urlLike) {
		return null;
	}

	try {
		const parsed = new URL(urlLike, self.location.origin);
		if (parsed.origin !== self.location.origin) {
			return null;
		}

		return `${parsed.pathname}${parsed.search}`;
	} catch {
		if (typeof urlLike !== 'string') {
			return null;
		}

		return urlLike.startsWith('/') ? urlLike : null;
	}
}

/**
 * How often to check for local pages that need refreshing
 */
export const REFRESH_INTERVAL = 900000; // 15 minutes

export async function isCachable(url) {
	const route = await db.routeMeta.get(url);
	return !!route;
}

function getResponseEtag(response) {
	return response.headers.get('ETag');
}

/**
 * Stores an inertia page in the DB
 * @param {object} data The inertia page data
 * @returns {Promise<void>}
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

export async function touchPage(url, savedAt = Date.now()) {
	await db.pages.update(url, { savedAt });
	console.debug('[Inertia Offline] Refreshed offline page timestamp', url);
}

/**
 * Fetches the list of cacheable routes from the local DB, updating from backend if needed
 * @returns {Promise<Array>} The list of cacheable routes
 */
export async function getRouteList(forceRefresh = false) {
	try {
		// check if we need to refresh the route list
		const meta = await db.system.get('routeListFetchedAt');
		const ttlMeta = await db.system.get('routeListTTL');
		const now = Date.now();
		if (!forceRefresh && meta && meta.value && ttlMeta && ttlMeta.value) {
			const age = now - meta.value;
			const ttlMs = ttlMeta.value * 1000; // convert from seconds to ms
			if (age < ttlMs) {
				// still fresh; return existing list
				return await db.routeMeta.toArray();
			}
		}

		const routeListEtag = await db.system.get('routeListETag');
		const headers = {};
		if (routeListEtag?.value) {
			headers['If-None-Match'] = routeListEtag.value;
		}

		// get list of cacheable routes from backend
		const routeRes = await fetch(ROUTE_META_PATH, {
			credentials: 'include',
			headers,
		});
		if (routeRes.status === 304) {
			await db.system.put({ key: 'routeListFetchedAt', value: now });
			console.debug('[Inertia Offline] Route list not modified');
			return await db.routeMeta.toArray();
		}

		if (!routeRes.ok) {
			console.warn('[Inertia Offline] Failed to fetch route list', routeRes.statusText);
			return [];
		}
		
		// parse response with new structure: {ttl, routes}
		const response = await routeRes.json();
		const { ttl, routes } = response;
		
		// store route details
		await db.routeMeta.clear();
		for (const r of routes) {
			await db.routeMeta.put({
				url: r.url,
				paginated: r.paginated,
				ttl: r.ttl,
			});
		}

		// update fetch time and store TTL
		await db.system.put({ key: 'routeListFetchedAt', value: now });
		await db.system.put({ key: 'routeListTTL', value: ttl || 0 });
		const etag = getResponseEtag(routeRes);
		if (etag) {
			await db.system.put({ key: 'routeListETag', value: etag });
		} else {
			await db.system.delete('routeListETag');
		}

		// return the routes array
		return routes;
	} catch (err) {
		console.warn('[Inertia Offline] getRouteList failed', err);
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
			console.warn('[Inertia Offline] Failed to fetch inertia version', res.statusText);
			return null;
		}
		
		// update version in system table
		const data = await res.json();
		await db.system.put({ key: 'inertiaVersion', value: data.version });

		return data.version || null;
	} catch (err) {
		console.warn('[Inertia Offline] getInertiaVersion failed', err);
		return null;
	}
}

async function ensureInertiaVersion(options = {}) {
	const { forceRefresh = false } = options;
	const localVersion = await getLocalInertiaVersion();
	if (!forceRefresh && localVersion) {
		console.debug('[Inertia Offline] Reusing local Inertia version', { localVersion });
		return localVersion;
	}

	console.debug('[Inertia Offline] Refreshing Inertia version before backend cache update requests', {
		forceRefresh,
		localVersion,
	});
	const remoteVersion = await getRemoteInertiaVersion();
	if (remoteVersion) {
		console.debug('[Inertia Offline] Updated Inertia version for refresh work', { remoteVersion });
		return remoteVersion;
	}

	console.warn('[Inertia Offline] Failed to refresh Inertia version; falling back to local version if available', {
		localVersion,
	});
	return localVersion;
}

export async function getOfflineTemplate(systemKey) {
	const rec = await db.system.get(systemKey);
	if (!rec?.value || typeof rec.value !== 'object') {
		console.debug('[Inertia Offline] Offline template cache miss', { systemKey });
		return null;
	}

	console.debug('[Inertia Offline] Offline template cache hit', {
		systemKey,
		savedAt: rec.value.savedAt,
	});
	return rec.value;
}

export async function refreshOfflineTemplate({ templatePath, placeholder, systemKey }) {
	if (!templatePath || !placeholder || !systemKey) {
		console.debug('[Inertia Offline] Skipping offline template refresh due to missing inputs', {
			templatePath,
			placeholder,
			systemKey,
		});
		return null;
	}

	try {
		console.debug('[Inertia Offline] Refreshing offline template', {
			templatePath,
			placeholder,
			systemKey,
		});
		const existing = await getOfflineTemplate(systemKey);
		const headers = {};
		if (existing?.etag) {
			headers['If-None-Match'] = existing.etag;
		}

		const templateRes = await fetch(`${templatePath}?placeholder=${encodeURIComponent(placeholder)}`, {
			credentials: 'include',
			headers,
		});

		if (templateRes.status === 304) {
			if (existing) {
				await db.system.put({
					key: systemKey,
					value: {
						...existing,
						savedAt: Date.now(),
					},
				});
			}

			console.debug('[Inertia Offline] Offline template unchanged (304)', { systemKey });
			return existing;
		}

		if (!templateRes.ok) {
			console.warn('[Inertia Offline] Failed to fetch offline template', templateRes.status, templateRes.statusText);
			return null;
		}

		const html = await templateRes.text();
		const rec = {
			html,
			etag: getResponseEtag(templateRes),
			templatePath,
			placeholder,
			savedAt: Date.now(),
		};

		await db.system.put({ key: systemKey, value: rec });
		console.debug('[Inertia Offline] Offline template stored', {
			systemKey,
			hasEtag: !!rec.etag,
			savedAt: rec.savedAt,
		});
		return rec;
	} catch (err) {
		console.warn('[Inertia Offline] refreshOfflineTemplate failed', err);
		return null;
	}
}

export async function setRootRedirect(sourcePath, targetPath) {
	const source = toRelativeSameOriginPath(sourcePath);
	const target = toRelativeSameOriginPath(targetPath);
	if (!source || !target || source === target) {
		console.debug('[Inertia Offline] Skipping root redirect set', {
			sourcePath,
			targetPath,
			source,
			target,
		});
		return;
	}

	await db.system.put({
		key: getRootRedirectSystemKey(source),
		value: {
			target,
			savedAt: Date.now(),
		},
	});
	console.debug('[Inertia Offline] Stored root redirect', { source, target });
}

export async function getRootRedirect(sourcePath = '/') {
	const source = toRelativeSameOriginPath(sourcePath);
	if (!source) {
		console.debug('[Inertia Offline] Root redirect lookup skipped due to invalid source', { sourcePath });
		return null;
	}

	const rec = await db.system.get(getRootRedirectSystemKey(source));
	const target = rec?.value?.target;
	const normalizedTarget = toRelativeSameOriginPath(target);
	console.debug('[Inertia Offline] Root redirect lookup result', {
		source,
		target,
		normalizedTarget,
		hit: !!normalizedTarget,
	});
	return normalizedTarget;
}

export async function getCachedPageResponse(path) {
	const rec = await getPage(path)
	if (!rec) {
		console.debug('[Inertia Offline] Cached page miss', { path })
		return null
	}

	console.log('[Inertia Offline] Serving cached Inertia page response', { path, savedAt: rec.savedAt })
	const headers = {
		'Content-Type': 'application/json',
		'X-Inertia': 'true',
	}
	if (rec.etag) {
		headers['ETag'] = rec.etag
	}

	return new Response(JSON.stringify({
		url: rec.url,
		component: rec.component,
		props: {
			...rec.props,

			// inject offline indicators
			_offline: true,
			_savedAt: rec.savedAt,
		},
		version: rec.version,
	}), {
		headers,
	})
}

export async function getRootRedirectResponse(path, inertiaRequest = false) {
	console.debug('[Inertia Offline] Resolving root redirect response', { path, inertiaRequest })
	if (path !== ROOT_REDIRECT_SOURCE_PATH) {
		return null
	}

	const targetPath = await getRootRedirect(ROOT_REDIRECT_SOURCE_PATH)
	if (!targetPath || targetPath === ROOT_REDIRECT_SOURCE_PATH) {
		console.debug('[Inertia Offline] No root redirect mapping found for response generation')
		return null
	}

	if (inertiaRequest) {
		console.debug('[Inertia Offline] Returning Inertia root redirect response', { targetPath })
		return new Response('', {
			status: 409,
			headers: {
				'X-Inertia': 'true',
				'X-Inertia-Location': targetPath,
			},
		})
	}

	console.debug('[Inertia Offline] Returning standard root redirect response', { targetPath })
	return Response.redirect(targetPath, 302)
}

export async function getOfflineNavigationResponse(path, options = {}) {
	const {
		templateSystemKey = OFFLINE_TEMPLATE_SYSTEM_KEY,
		templatePlaceholder = OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
	} = options

	console.debug('[Inertia Offline] Attempting offline navigation response', { path, templateSystemKey })
	if (path === ROOT_REDIRECT_SOURCE_PATH) {
		const redirectRes = await getRootRedirectResponse(path, false)
		if (redirectRes) {
			console.debug('[Inertia Offline] Offline navigation using root redirect response')
			return redirectRes
		}
	}

	const targetPath = path

	const isCacheable = await isCachable(targetPath)
	if (!isCacheable) {
		console.debug('[Inertia Offline] Offline navigation route is not cacheable', { targetPath })
		return null
	}

	const [templateRec, pageRec] = await Promise.all([
		getOfflineTemplate(templateSystemKey),
		getPage(targetPath),
	])

	if (!templateRec?.html || !pageRec) {
		console.debug('[Inertia Offline] Offline navigation missing template or cached page', {
			hasTemplate: !!templateRec?.html,
			hasPage: !!pageRec,
			targetPath,
		})
		return null
	}

	const payload = JSON.stringify({
		url: pageRec.url,
		component: pageRec.component,
		props: {
			...pageRec.props,
			_offline: true,
			_savedAt: pageRec.savedAt,
		},
		version: pageRec.version,
	})

	const html = replaceSinglePlaceholder(templateRec.html, templatePlaceholder, escapeHtmlAttribute(payload))
	if (!html) {
		console.warn('[Inertia Offline] Offline template placeholder validation failed')
		return null
	}

	console.debug('[Inertia Offline] Returning assembled offline navigation HTML', {
		targetPath,
		savedAt: pageRec.savedAt,
	})

	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	})
}

export async function maybeRecordRootRedirect(path, networkRes, pageData = null) {
	if (path !== ROOT_REDIRECT_SOURCE_PATH) {
		return
	}

	console.debug('[Inertia Offline] Evaluating potential root redirect mapping from network response', {
		path,
		status: networkRes.status,
		redirected: networkRes.redirected,
		url: networkRes.url,
		hasInertiaLocation: !!networkRes.headers.get('X-Inertia-Location'),
		hasPageDataUrl: !!pageData?.url,
	})

	let targetPath = null

	const inertiaLocation = networkRes.headers.get('X-Inertia-Location')
	if (inertiaLocation) {
		targetPath = toRelativeSameOriginPath(inertiaLocation)
	}

	if (!targetPath && networkRes.redirected && networkRes.url) {
		targetPath = toRelativeSameOriginPath(networkRes.url)
	}

	if (!targetPath && pageData?.url) {
		targetPath = toRelativeSameOriginPath(pageData.url)
	}

	if (targetPath && targetPath !== ROOT_REDIRECT_SOURCE_PATH) {
		await setRootRedirect(ROOT_REDIRECT_SOURCE_PATH, targetPath)
		console.debug('[Inertia Offline] Root redirect mapping recorded from network response', {
			source: ROOT_REDIRECT_SOURCE_PATH,
			targetPath,
		})
		return
	}

	console.debug('[Inertia Offline] Network response did not yield a root redirect mapping')
}

async function refreshRootRedirect(sourcePath = '/', inertiaVersion = null) {
	const source = toRelativeSameOriginPath(sourcePath);
	if (!source) {
		console.debug('[Inertia Offline] Root redirect refresh skipped due to invalid source', { sourcePath });
		return null;
	}

	try {
		console.debug('[Inertia Offline] Refreshing root redirect mapping', { source });
		const currentVersion = inertiaVersion || await ensureInertiaVersion();
		if (!currentVersion) {
			console.warn('[Inertia Offline] Root redirect refresh skipped because no Inertia version is available', { source });
			return null;
		}

		const headers = {
			'X-Inertia': 'true',
			'X-Inertia-Version': currentVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'application/json',
		};

		const res = await fetch(source, {
			headers,
			credentials: 'include',
		});

		let target = toRelativeSameOriginPath(res.headers.get('X-Inertia-Location'));
		if (!target && res.redirected && res.url) {
			target = toRelativeSameOriginPath(res.url);
		}

		if (!target) {
			try {
				const data = await res.clone().json();
				target = toRelativeSameOriginPath(data?.url);
				console.debug('[Inertia Offline] Root redirect derived from Inertia payload url', {
					source,
					target,
				});
			} catch {
				// ignore non-json responses while probing redirect target
			}
		}

		if (target && target !== source) {
			await setRootRedirect(source, target);
			console.debug('[Inertia Offline] Root redirect refreshed', { source, target });
			return target;
		}

		// If source no longer redirects, clear stale mapping.
		await db.system.delete(getRootRedirectSystemKey(source));
		console.debug('[Inertia Offline] Root redirect cleared because source no longer redirects', { source });
		return null;
	} catch (err) {
		console.warn('[Inertia Offline] refreshRootRedirect failed', err);
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
 * Refresh cached pages once their minimum refresh interval has elapsed
 * @returns {Promise<void>}
 */
export async function refreshAllExpired(options = {}) { // TODO: define options for IDE autocomplete
	try {
		const { templatePath, templatePlaceholder, templateSystemKey, rootRedirectPath } = options;
		console.debug('[Inertia Offline] refreshAllExpired started', {
			hasTemplateOptions: !!(templatePath && templatePlaceholder && templateSystemKey),
			rootRedirectPath,
		});
		const inertiaVersion = await ensureInertiaVersion({ forceRefresh: true });
		console.debug('[Inertia Offline] refreshAllExpired using Inertia version', { inertiaVersion });

		if (templatePath && templatePlaceholder && templateSystemKey) {
			await refreshOfflineTemplate({
				templatePath,
				placeholder: templatePlaceholder,
				systemKey: templateSystemKey,
			});
		}

		if (rootRedirectPath) {
			await refreshRootRedirect(rootRedirectPath, inertiaVersion);
		}

		// get list of cacheable routes
		const list = await getRouteList();

		// build list of pages that are now eligible for refresh
		const toRefresh = [];
		for (const route of list) {
			const rec = await db.pages.get(route.url);
			if (!rec) {
				// not cached yet
				toRefresh.push(route);
			} else {
				// ttl is the minimum time between refreshes (in seconds) for this route
				const isExpired = (rec.savedAt + (route.ttl || 0) * 1000) < Date.now();
				if (isExpired) {
					toRefresh.push(route);
				}
			}
		}

		// return early if there's nothing to refresh
		if (toRefresh.length === 0) {
			console.debug('[Inertia Offline] No pages to refresh');
			return;
		}

		// start with one page in case we need to cache bust
		const firstPage = toRefresh.pop();
		await cachePage(firstPage.url, { inertiaVersion });

		if (toRefresh.length === 0) {
			return;
		}

		// deterministic queue worker model
		let index = 0;
		const workerCount = Math.min(REFRESH_CONCURRENCY, toRefresh.length);
		const workers = Array.from({ length: workerCount }, async () => {
			while (index < toRefresh.length) {
				const currentIndex = index;
				index += 1;

				const route = toRefresh[currentIndex];
				try {
					await cachePage(route.url, { inertiaVersion });
				} catch (err) {
					console.warn('[Inertia Offline] Failed refreshing route', route.url, err);
				}

				if (REFRESH_STAGGER > 0) {
					await new Promise((resolve) => setTimeout(resolve, REFRESH_STAGGER));
				}
			}
		});

		await Promise.all(workers);
	} catch (err) {
		console.warn('[Inertia Offline] refreshAllExpired failed', err);
	}
}

/**
 * Caches a page by fetching it from the backend and storing in the DB
 * @param {string} url The URL of the page to cache
 * @returns {Promise<void>}
 */
export async function cachePage(url, options = { retryOnVersionMismatch: true, inertiaVersion: null }) {
	try {
		// get local inertia version
		const currentVersion = options.inertiaVersion || await ensureInertiaVersion();
		if (!currentVersion) {
			console.warn('[Inertia Offline] Skipping cachePage because no Inertia version is available', { url });
			return;
		}

		const existingPage = await getPage(url);
		const headers = {
			'X-Inertia': 'true',
			'X-Inertia-Version': currentVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'application/json',
		};
		if (existingPage?.etag) {
			headers['If-None-Match'] = existingPage.etag;
		}

		// make the inertia-like request
		const res = await fetch(url, {
			headers,
			credentials: 'include',
		});
		if (res.status === 304) {
			if (existingPage) {
				await touchPage(url);
				return;
			}

			console.warn('[Inertia Offline] Received 304 for uncached page', url);
			return;
		}

		if (!res.ok) {
			// check for 409 version mismatch
			if (res.status === 409) {
				if (!options.retryOnVersionMismatch) {
					console.warn('[Inertia Offline] Version mismatch persisted after one retry; leaving cache empty for route', url);
					return;
				}

				console.warn('[Inertia Offline] Version mismatch detected for offline page. Clearing stale state and retrying once.', url);
				await cacheBust();
				await getRouteList(true);
				const refreshedVersion = await ensureInertiaVersion({ forceRefresh: true });
				await cachePage(url, { retryOnVersionMismatch: false, inertiaVersion: refreshedVersion });
			} else {
				console.warn('[Inertia Offline] Failed to fetch offline page for caching', url, res.statusText);
			}
			return;
		}

		// update the local db
		const data = await res.json();
		await storePage(data, { etag: getResponseEtag(res) });
	} catch (err) {
		console.warn('[Inertia Offline] Failed to cache offline page', url, err);
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
		console.warn('[Inertia Offline] cacheBust failed', err);
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
	console.debug('[Inertia Offline] Cleared all offline data');
}

/**
 * Starts a periodic refresh cycle to refresh expired pages
 * @param {number} intervalMs Interval in milliseconds between refresh cycles. Default is 5 minutes.
 * @returns {Function} A function to stop the refresh cycle
 */
export async function startRefreshCycle(intervalMs = REFRESH_INTERVAL) {
	// run once now
	if (navigator.onLine) {
		console.debug('[Inertia Offline] Running offline refresh cycle');
		await refreshAllExpired();
	}

	// then run periodic timer while app stays open
	const id = setInterval(async () => {
		// only run when online
		if (navigator.onLine) {
			console.debug('[Inertia Offline] Running offline refresh cycle');
			await refreshAllExpired();
		}
	}, intervalMs);

	return () => clearInterval(id); // returns stop function
}