import { REFRESH_CONCURRENCY, REFRESH_STAGGER, ROOT_REDIRECT_SOURCE_PATH, OFFLINE_TEMPLATE_PATH, OFFLINE_TEMPLATE_PAGE_PLACEHOLDER, OFFLINE_TEMPLATE_SYSTEM_KEY } from './constants.js';
import { getPage, storePage, touchPage } from './pages.js';
import { getRouteList } from './routes.js';
import { ensureInertiaVersion } from './version.js';
import { refreshOfflineTemplate } from './template.js';
import { refreshRootRedirect } from './redirects.js';
import { getResponseEtag, logDebug, logWarn } from './utils.js';
import { clearAllData } from './data.js';

/**
 * Builds and returns an options object for the refresh process, including
 * template configuration and root redirect path.
 * @returns {Object} An object containing the options.
 */
export function getRefreshOptions() {
	const options = {
		templatePath: OFFLINE_TEMPLATE_PATH,
		templatePlaceholder: OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
		templateSystemKey: OFFLINE_TEMPLATE_SYSTEM_KEY,
		rootRedirectPath: ROOT_REDIRECT_SOURCE_PATH,
	}
	return options
}

/**
 * Refreshes all expired pages and templates based on the provided options.
 * @param {Object} options - The options for the refresh process.
 * @param {string} [options.templatePath] - The path to the offline template.
 * @param {string} [options.templatePlaceholder] - The placeholder for the offline template.
 * @param {string} [options.templateSystemKey] - The system key for the offline template.
 * @param {string} [options.rootRedirectPath] - The path for the root redirect.
 * @returns {Promise<void>} A promise that resolves when the refresh process is complete.
 */
export async function refreshAllExpired(options = {}) {
	try {
		// extract options
		const { templatePath, templatePlaceholder, templateSystemKey, rootRedirectPath } = options;
		logDebug('refreshAllExpired started', {
			hasTemplateOptions: !!(templatePath && templatePlaceholder && templateSystemKey),
			rootRedirectPath,
		});

		// ensure we have the current Inertia version
		const inertiaVersion = await ensureInertiaVersion({ forceRefresh: true });
		logDebug('refreshAllExpired using Inertia version', { inertiaVersion });

		// refresh the offline template if we have the necessary options
		if (templatePath && templatePlaceholder && templateSystemKey) {
			await refreshOfflineTemplate(
				templatePath,
				templatePlaceholder,
				templateSystemKey,
			);
		}

		// refresh the root redirect mapping if a path is provided
		if (rootRedirectPath) {
			await refreshRootRedirect(rootRedirectPath, inertiaVersion);
		}

		// get the list of pages to refresh
		const list = await getRouteList();
		const toRefresh = [];

		// check each page in the list
		for (const route of list) {
			const rec = await getPage(route.url);
			if (!rec) {
				// if we don't have a cached page, add it to the refresh list
				toRefresh.push(route);
			} else {
				// if we do have a cached page, check if it's due for a refresh
				const isExpired = (rec.savedAt + (route.ttl || 0) * 1000) < Date.now();
				if (isExpired) {
					toRefresh.push(route);
				}
			}
		}

		// if there are no pages to refresh, we can exit early
		if (toRefresh.length === 0) {
			logDebug('No pages to refresh');
			return;
		}

		// start with the first one to trigger any necessary version updates before refreshing the rest
		const firstPage = toRefresh.pop();
		await cachePage(firstPage.url, { inertiaVersion });

		// if there was only one page to refresh, we're done
		if (toRefresh.length === 0) {
			return;
		}

		// refresh the remaining pages with concurrency and staggering
		let index = 0;
		const workerCount = Math.min(REFRESH_CONCURRENCY, toRefresh.length);
		const workers = Array.from({ length: workerCount }, async () => {
			// each worker will process pages from the toRefresh list until it's empty
			while (index < toRefresh.length) {
				// capture the current index and increment it for the next worker
				const currentIndex = index;
				index += 1;

				// get the route to refresh
				const route = toRefresh[currentIndex];
				try {
					// attempt to cache the page
					await cachePage(route.url, { inertiaVersion });
				} catch (err) {
					logWarn('Failed refreshing route', route.url, err);
				}

				// stagger the next refresh to avoid overwhelming the network or server
				if (REFRESH_STAGGER > 0) {
					await new Promise((resolve) => setTimeout(resolve, REFRESH_STAGGER));
				}
			}
		});

		// wait for all workers to finish
		await Promise.all(workers);
	} catch (err) {
		logWarn('refreshAllExpired failed', err);
	}
}

/**
 * Caches a page for offline use, handling version mismatches and retries.
 * @param {string} url - The URL of the page to cache.
 * @param {Object} [options] - Options for caching the page.
 * @param {boolean} [options.retryOnVersionMismatch=true] - Whether to retry caching on version mismatch.
 * @param {string|null} [options.inertiaVersion=null] - The Inertia version to use for the request, or null to use the current version.
 * @returns {Promise<void>} A promise that resolves when the page has been cached.
 */
export async function cachePage(url, options = { retryOnVersionMismatch: true, inertiaVersion: null }) {
	try {
		// ensure we have the current Inertia version for the request
		const currentVersion = options.inertiaVersion || await ensureInertiaVersion();
		if (!currentVersion) {
			logWarn('Skipping cachePage because no Inertia version is available', { url });
			return;
		}

		// attempt to get the existing cached page to include its ETag for conditional requests
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

		// make the request to fetch the page data
		const res = await fetch(url, {
			headers,
			credentials: 'include',
		});

		// if we receive a 304 Not Modified, we can simply update the timestamp of the existing page
		if (res.status === 304) {
			if (existingPage) {
				await touchPage(url);
				return;
			}

			logWarn('Received 304 for uncached page', url);
			return;
		}

		if (!res.ok) {
			// if the response is not successful, check if it's an inertia version mismatch
			if (res.status === 409) {
				// if we've already retried once due to a version mismatch,
				// we should not retry again to avoid potential infinite loops
				if (!options.retryOnVersionMismatch) {
					logWarn('Version mismatch persisted after one retry; leaving cache empty for route', url);
					return;
				}

				// if we have a version mismatch, it's likely that the route list or inertia version is stale,
				// so we should clear the cache and retry once to get the updated version and route list
				logWarn('Version mismatch detected for offline page. Clearing stale state and retrying once.', url);
				await clearAllData();
				await getRouteList(true);
				const refreshedVersion = await ensureInertiaVersion({ forceRefresh: true });
				await cachePage(url, { retryOnVersionMismatch: false, inertiaVersion: refreshedVersion });
			} else {
				// for other types of errors, we can log a warning and skip caching this page for now
				logWarn('Failed to fetch offline page for caching', url, res.statusText);
			}
			return;
		}

		// if the response is successful, we can cache the page data for offline use
		const data = await res.json();
		await storePage(data, { etag: getResponseEtag(res) });
	} catch (err) {
		logWarn('Failed to cache offline page', url, err);
	}
}
