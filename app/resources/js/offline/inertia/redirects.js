import { db } from './db.js';
import { ROOT_REDIRECT_KEY_PREFIX, ROOT_REDIRECT_SOURCE_PATH } from './constants.js';
import { ensureInertiaVersion } from './version.js';
import { logDebug, logWarn } from './utils.js';

/**
 * Converts a URL-like string to a relative path if it is on the same origin.
 * @param {string} urlLike - The URL-like string to convert.
 * @returns {string|null} The relative path if the URL is on the same origin, otherwise null.
 */
function toRelativeSameOriginPath(urlLike) {
	// can't do anything with empty values
	if (!urlLike) {
		return null;
	}

	try {
		// attempt to parse the URL and ensure it's same-origin
		const parsed = new URL(urlLike, self.location.origin);
		if (parsed.origin !== self.location.origin) {
			return null;
		}

		return `${parsed.pathname}${parsed.search}`;
	} catch {
		// not something we can work with
		if (typeof urlLike !== 'string') {
			return null;
		}

		// if it looks like a relative path, return it as-is, otherwise give up
		return urlLike.startsWith('/') ? urlLike : null;
	}
}

/**
 * Generates a system key for storing root redirect information in the database.
 * @param {string} path - The source path for the root redirect.
 * @returns {string} The system key for the root redirect.
 */
function getRootRedirectSystemKey(path = '/') {
	return `${ROOT_REDIRECT_KEY_PREFIX}${path}`;
}

/**
 * Stores a root redirect mapping in the database.
 * @param {string} sourcePath - The source path for the root redirect.
 * @param {string} targetPath - The target path for the root redirect.
 * @returns {Promise<void>} A promise that resolves when the root redirect has been stored.
 */
export async function setRootRedirect(sourcePath, targetPath) {
	// ensure paths are same-origin
	const source = toRelativeSameOriginPath(sourcePath);
	const target = toRelativeSameOriginPath(targetPath);

	// can't store it if we don't have both source and target, or if they are the same (no redirect)
	if (!source || !target || source === target) {
		logDebug('Skipping root redirect set', {
			sourcePath,
			targetPath,
			source,
			target,
		});
		return;
	}

	// store the mapping in the system table
	await db.system.put({
		key: getRootRedirectSystemKey(source),
		value: {
			target,
			savedAt: Date.now(),
		},
	});
	logDebug('Stored root redirect', { source, target });
}

/**
 * Retrieves a root redirect mapping from the database.
 * @param {string} sourcePath - The source path for the root redirect.
 * @returns {Promise<string|null>} A promise that resolves with the target path, or null if not found.
 */
export async function getRootRedirect(sourcePath = '/') {
	// ensure path is same-origin
	const source = toRelativeSameOriginPath(sourcePath);

	// can't retrieve it if we don't have a valid source
	if (!source) {
		logDebug('Root redirect lookup skipped due to invalid source', { sourcePath });
		return null;
	}

	// look up the mapping in the system table
	const rec = await db.system.get(getRootRedirectSystemKey(source));
	const target = rec?.value?.target;

	// ensure target is still same-origin and valid
	const normalizedTarget = toRelativeSameOriginPath(target);
	logDebug('Root redirect lookup result', {
		source,
		target,
		normalizedTarget,
		hit: !!normalizedTarget,
	});

	return normalizedTarget;
}

/**
 * Generates a response for a root redirect, either as an Inertia response or a standard HTTP redirect.
 * @param {string} path - The source path for the root redirect.
 * @param {boolean} inertiaRequest - Whether the request is an Inertia request.
 * @returns {Promise<Response|null>} A promise that resolves with the redirect response, or null if no redirect is needed.
 */
export async function getRootRedirectResponse(path, inertiaRequest = false) {
	logDebug('Resolving root redirect response', { path, inertiaRequest })

	// root redirects only apply to the defined source path
	if (path !== ROOT_REDIRECT_SOURCE_PATH) {
		return null
	}

	// look up the target path for the root redirect and ensure it's valid
	const targetPath = await getRootRedirect(ROOT_REDIRECT_SOURCE_PATH)
	if (!targetPath || targetPath === ROOT_REDIRECT_SOURCE_PATH) {
		logDebug('No root redirect mapping found for response generation')
		return null
	}

	// if it's an Inertia request, return a 409 with the target in the X-Inertia-Location header
	if (inertiaRequest) {
		logDebug('Returning Inertia root redirect response', { targetPath })
		return new Response('', {
			status: 409,
			headers: {
				'X-Inertia': 'true',
				'X-Inertia-Location': targetPath,
			},
		})
	}

	// otherwise, return a standard 302 redirect response
	logDebug('Returning standard root redirect response', { targetPath })
	return Response.redirect(targetPath, 302)
}

/**
 * Extracts the target path from a network response or page data (for a root redirect).
 * @param {Response} res - The network response to extract the target from.
 * @param {Object|null} pageData - The page data to use as a fallback if the response does not contain a target.
 * @returns {Promise<string|null>} A promise that resolves with the target path, or null if not found.
 */
async function extractTargetFromResponse(res, pageData = null) {
	// first attempt to extract the target from the X-Inertia-Location header
	let target = toRelativeSameOriginPath(res.headers.get('X-Inertia-Location'));

	// if the header is not present or valid, and the response is a redirect,
	// attempt to extract the target from the response URL
	if (!target && res.redirected && res.url) {
		target = toRelativeSameOriginPath(res.url);
	}

	// if we still don't have a target, and the page data has a URL, attempt to use that as a fallback
	if (!target) {
		if (pageData?.url) {
			target = toRelativeSameOriginPath(pageData.url);
		} else {
			// as a last resort, if the response is JSON, attempt to parse it and extract a URL from the page data
			try {
				const data = await res.clone().json();
				target = toRelativeSameOriginPath(data?.url);
			} catch {
				// ignore non-json responses while probing redirect target
			}
		}
	}

	return target || null;
}

/**
 * Evaluates a network response and page data to determine if a root redirect should be recorded.
 * @param {string} path - The source path for the root redirect.
 * @param {Response} networkRes - The network response to evaluate.
 * @param {Object|null} pageData - The page data to use as a fallback if the response does not contain a target.
 * @returns {Promise<void>} A promise that resolves when the root redirect has been recorded, if applicable.
 */
export async function maybeRecordRootRedirect(path, networkRes, pageData = null) {
	// root redirects only apply to the defined source path
	if (path !== ROOT_REDIRECT_SOURCE_PATH) {
		return
	}

	logDebug('Evaluating potential root redirect mapping from network response', {
		path,
		status: networkRes.status,
		redirected: networkRes.redirected,
		url: networkRes.url,
		hasInertiaLocation: !!networkRes.headers.get('X-Inertia-Location'),
		hasPageDataUrl: !!pageData?.url,
	})

	// attempt to extract the target path from the response and page data
	const targetPath = await extractTargetFromResponse(networkRes, pageData);

	// if we have a valid target path that is different from the source, record the root redirect mapping
	if (targetPath && targetPath !== ROOT_REDIRECT_SOURCE_PATH) {
		await setRootRedirect(ROOT_REDIRECT_SOURCE_PATH, targetPath)
		logDebug('Root redirect mapping recorded from network response', {
			source: ROOT_REDIRECT_SOURCE_PATH,
			targetPath,
		})
		return
	}

	logDebug('Network response did not yield a root redirect mapping')
}

/**
 * Proactively refreshes the root redirect mapping for a given source path.
 * @param {string} sourcePath - The source path for the root redirect.
 * @param {string|null} inertiaVersion - The Inertia version to use for the request, or null to use the current version.
 * @returns {Promise<string|null>} A promise that resolves with the target path, or null if no redirect is needed.
 */
export async function refreshRootRedirect(sourcePath = '/', inertiaVersion = null) {
	// ensure source path is same-origin
	const source = toRelativeSameOriginPath(sourcePath);
	if (!source) {
		logDebug('Root redirect refresh skipped due to invalid source', { sourcePath });
		return null;
	}

	try {
		logDebug('Refreshing root redirect mapping', { source });

		// ensure we have the current Inertia version
		const currentVersion = inertiaVersion || await ensureInertiaVersion();
		if (!currentVersion) {
			logWarn('Root redirect refresh skipped because no Inertia version is available', { source });
			return null;
		}

		// build the request headers
		const headers = {
			'X-Inertia': 'true',
			'X-Inertia-Version': currentVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'application/json',
		};

		// make the request to the source path
		const res = await fetch(source, {
			headers,
			credentials: 'include',
		});

		// attempt to extract the target path from the response and page data
		const target = await extractTargetFromResponse(res);

		// if we have a valid target path that is different from the source, update the root redirect mapping
		if (target && target !== source) {
			await setRootRedirect(source, target);
			logDebug('Root redirect refreshed', { source, target });
			return target;
		}

		// if we don't have a valid target, or the target is the same as the source, clear any existing root redirect mapping
		await db.system.delete(getRootRedirectSystemKey(source));
		logDebug('Root redirect cleared because source no longer redirects', { source });
		return null;
	} catch (err) {
		logWarn('refreshRootRedirect failed', err);
		return null;
	}
}
