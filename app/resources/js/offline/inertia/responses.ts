/**
 * Response generation for offline Inertia pages.
 * Constructs responses from cached page data and templates.
 */

import {
	OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
	OFFLINE_TEMPLATE_SYSTEM_KEY,
	ROOT_REDIRECT_SOURCE_PATH,
} from './constants';
import { getPage } from './pages';
import { getOfflineTemplate } from './template';
import { isCachable } from './routes';
import { getRootRedirectResponse } from './redirects';
import { logDebug, logWarn } from './utils';
import type { InertiaPage } from './types/db';

/**
 * Options for offline navigation response generation.
 */
interface OfflineNavigationResponseOptions {
	/** System key for storing the offline template (for retrieval) */
	templateSystemKey?: string;
	/** Placeholder string in template to replace with page data */
	templatePlaceholder?: string;
	/** Root path for redirect handling */
	rootRedirectPath?: string;
}

/**
 * Escapes special characters in a string for safe use in HTML attributes.
 * @param value - The string to escape
 * @returns The escaped string safe for HTML attributes
 */
function escapeHtmlAttribute(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;');
}

/**
 * Replaces a single occurrence of a placeholder in template HTML.
 * Validates that exactly one instance exists before replacing.
 * @param templateHtml - The HTML template containing the placeholder
 * @param placeholder - The placeholder string to replace
 * @param replacement - The replacement value
 * @returns HTML with placeholder replaced, or null if validation fails
 */
function replaceSinglePlaceholder(templateHtml: any, placeholder: string, replacement: string): string | null {
	// Must be a string to work with
	if (typeof templateHtml !== 'string') {
		return null;
	}

	// Exactly one instance of placeholder must exist
	const placeholderCount = templateHtml.split(placeholder).length - 1;
	if (placeholderCount !== 1) {
		return null;
	}

	// Replace the single instance
	return templateHtml.replace(placeholder, replacement);
}

/**
 * Gets a cached page response for the requested path.
 * Constructs a JSON response that mimics a real Inertia page response,
 * including ETag and marking it as offline with saved timestamp.
 * @param path - The request path
 * @returns Response object with cached page data, or null if not cached
 */
export async function getCachedPageResponse(path: string): Promise<Response | null> {
	// Attempt to get the cached page data
	const rec: InertiaPage | undefined = await getPage(path);
	if (!rec) {
		logDebug('Cached page miss', { path });
		return null;
	}

	logDebug('Serving cached Inertia page response', { path, savedAt: rec.savedAt });

	// Build response headers
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-Inertia': 'true',
	};
	if (rec.etag) {
		headers['ETag'] = rec.etag;
	}

	// Construct response that mimics a real Inertia page response
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
	});
}

/**
 * Gets an offline navigation response for the requested path.
 * Combines offline template with cached page data to render a full HTML page.
 * Falls back to root redirect if applicable.
 * @param path - The request path
 * @param options - Configuration options
 * @returns Response with offline HTML, or null if unavailable
 */
export async function getOfflineNavigationResponse(
	path: string,
	options: OfflineNavigationResponseOptions = {},
): Promise<Response | null> {
	// Extract options with defaults
	const {
		templateSystemKey = OFFLINE_TEMPLATE_SYSTEM_KEY,
		templatePlaceholder = OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
		rootRedirectPath = ROOT_REDIRECT_SOURCE_PATH,
	} = options;

	logDebug('Attempting offline navigation response', { path, templateSystemKey });

	// For root path, attempt to serve root redirect if available
	if (path === rootRedirectPath) {
		const redirectRes = await getRootRedirectResponse(path, false, rootRedirectPath);
		if (redirectRes) {
			logDebug('Offline navigation using root redirect response');
			return redirectRes;
		}
	}

	const targetPath = path;

	// Check if the target path is cacheable
	const routeIsCacheable = await isCachable(targetPath);
	if (!routeIsCacheable) {
		logDebug('Offline navigation route is not cacheable', { targetPath });
		return null;
	}

	// Get offline template and cached page data in parallel
	const [templateRec, pageRec] = await Promise.all([
		getOfflineTemplate(templateSystemKey),
		getPage(targetPath),
	]);

	// Can't serve offline response without both template and page
	if (!templateRec?.html || !pageRec) {
		logDebug('Offline navigation missing template or cached page', {
			hasTemplate: !!templateRec?.html,
			hasPage: !!pageRec,
			targetPath,
		});
		return null;
	}

	// Assemble offline navigation response
	const payload = JSON.stringify({
		url: pageRec.url,
		component: pageRec.component,
		props: {
			...pageRec.props,
			_offline: true,
			_savedAt: pageRec.savedAt,
		},
		version: pageRec.version,
	});

	// Escape payload and replace placeholder in template
	const html = replaceSinglePlaceholder(templateRec.html, templatePlaceholder, escapeHtmlAttribute(payload));
	if (!html) {
		logWarn('Offline template placeholder validation failed');
		return null;
	}

	logDebug('Returning assembled offline navigation HTML', {
		targetPath,
		savedAt: pageRec.savedAt,
	});

	// Return the assembled HTML as a response
	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	});
}
