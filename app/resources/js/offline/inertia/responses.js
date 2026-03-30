import {
	OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
	OFFLINE_TEMPLATE_SYSTEM_KEY,
	ROOT_REDIRECT_SOURCE_PATH,
} from './constants.js';
import { getPage } from './pages.js';
import { getOfflineTemplate } from './template.js';
import { isCachable } from './routes.js';
import { getRootRedirectResponse } from './redirects.js';
import { logDebug, logWarn } from './utils.js';

/**
 * Escapes special characters in a string for use in HTML attributes.
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtmlAttribute(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;')
}

/**
 * Replaces a single placeholder in the template HTML with the provided replacement.
 * @param {string} templateHtml - The HTML template containing the placeholder.
 * @param {string} placeholder - The placeholder to replace.
 * @param {string} replacement - The replacement value for the placeholder.
 * @returns {string|null} The HTML with the placeholder replaced, or null if validation fails.
 */
function replaceSinglePlaceholder(templateHtml, placeholder, replacement) {
	// we can only work with strings
	if (typeof templateHtml !== 'string') {
		return null
	}

	// there must be exactly one instance of the placeholder in the template for it to be valid
	const placeholderCount = templateHtml.split(placeholder).length - 1
	if (placeholderCount !== 1) {
		return null
	}

	// replace the single instance of the placeholder with the replacement value
	return templateHtml.replace(placeholder, replacement)
}

/**
 * Retrieves a cached page response for the given path.
 * @param {string} path - The path of the cached page.
 * @returns {Promise<Response|null>} A promise that resolves to the cached page response, or null if not found.
 */
export async function getCachedPageResponse(path) {
	// attempt to get the cached page data for the requested path
	const rec = await getPage(path)
	if (!rec) {
		logDebug('Cached page miss', { path })
		return null
	}

	logDebug('Serving cached Inertia page response', { path, savedAt: rec.savedAt })

	// build the response headers
	const headers = {
		'Content-Type': 'application/json',
		'X-Inertia': 'true',
	}
	if (rec.etag) {
		headers['ETag'] = rec.etag
	}

	// construct a response object that mimics a real Inertia page response
	return new Response(JSON.stringify({
		url: rec.url,
		component: rec.component,
		props: {
			...rec.props,
			_offline: true,
			_savedAt: rec.savedAt,
		},
		version: rec.version,
	}), {
		headers,
	})
}

/**
 * Retrieves an offline navigation response for the given path.
 * @param {string} path - The path of the offline navigation.
 * @param {Object} [options] - Options for the offline navigation response.
 * @param {string} [options.templateSystemKey] - The system key for the offline template.
 * @param {string} [options.templatePlaceholder] - The placeholder for the offline template.
 * @returns {Promise<Response|null>} A promise that resolves to the offline navigation response, or null if not available.
 */
export async function getOfflineNavigationResponse(path, options = {}) {
	// extract options with defaults
	const {
		templateSystemKey = OFFLINE_TEMPLATE_SYSTEM_KEY,
		templatePlaceholder = OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
		rootRedirectPath = ROOT_REDIRECT_SOURCE_PATH,
	} = options

	logDebug('Attempting offline navigation response', { path, templateSystemKey })

	// if the requested path is the root redirect source, we should attempt to serve
	// the root redirect response if available
	if (path === rootRedirectPath) {
		const redirectRes = await getRootRedirectResponse(path, false, rootRedirectPath)
		if (redirectRes) {
			logDebug('Offline navigation using root redirect response')
			return redirectRes
		}
	}

	const targetPath = path

	// check if the target path is cacheable before doing any more work to attempt to serve it offline
	const routeIsCacheable = await isCachable(targetPath)
	if (!routeIsCacheable) {
		logDebug('Offline navigation route is not cacheable', { targetPath })
		return null
	}

	// attempt to get the offline template and cached page data
	const [templateRec, pageRec] = await Promise.all([
		getOfflineTemplate(templateSystemKey),
		getPage(targetPath),
	])

	// if we don't have either the template or the cached page, we can't serve an offline navigation response
	if (!templateRec?.html || !pageRec) {
		logDebug('Offline navigation missing template or cached page', {
			hasTemplate: !!templateRec?.html,
			hasPage: !!pageRec,
			targetPath,
		})
		return null
	}

	// assemble the offline navigation response
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

	// escape the payload and replace the placeholder in the template
	const html = replaceSinglePlaceholder(templateRec.html, templatePlaceholder, escapeHtmlAttribute(payload))
	if (!html) {
		logWarn('Offline template placeholder validation failed')
		return null
	}

	logDebug('Returning assembled offline navigation HTML', {
		targetPath,
		savedAt: pageRec.savedAt,
	})

	// return the assembled HTML as a response
	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	})
}
