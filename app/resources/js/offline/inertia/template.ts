/**
 * Offline template management for PWA.
 * Stores and refreshes HTML templates used for offline pages.
 */

import { db } from './db';
import { getResponseEtag, logDebug, logWarn } from './utils';

/**
 * Offline template record stored in the system table.
 */
interface OfflineTemplateRecord {
	/** The HTML template content */
	html: string;
	/** ETag from server response for cache validation */
	etag: string | null;
	/** Path where the template was fetched from */
	templatePath: string;
	/** Placeholder string to replace with page data */
	placeholder: string;
	/** Timestamp when template was saved */
	savedAt: number;
}

/**
 * Retrieves the offline template from cache.
 * @param systemKey - System key for the template
 * @returns Template record if cached, otherwise null
 */
export async function getOfflineTemplate(systemKey: string): Promise<OfflineTemplateRecord | null> {
	const rec = await db.system.get(systemKey);
	if (!rec?.value || typeof rec.value !== 'object') {
		logDebug('Offline template cache miss', { systemKey });
		return null;
	}

	logDebug('Offline template cache hit', {
		systemKey,
		savedAt: rec.value.savedAt,
	});
	return rec.value;
}

/**
 * Refreshes the offline template from the server.
 * Uses ETags for efficient cache validation.
 * Stores template with metadata for future reference.
 * @param templatePath - Server path to fetch template from
 * @param placeholder - Placeholder identifier used in template
 * @param systemKey - System key for storing the template
 * @returns Updated template record, or null if refresh failed
 */
export async function refreshOfflineTemplate(
	templatePath: string,
	placeholder: string,
	systemKey: string,
): Promise<OfflineTemplateRecord | null> {
	// All inputs required
	if (!templatePath || !placeholder || !systemKey) {
		logDebug('Skipping offline template refresh due to missing inputs', {
			templatePath,
			placeholder,
			systemKey,
		});
		return null;
	}

	try {
		logDebug('Refreshing offline template', {
			templatePath,
			placeholder,
			systemKey,
		});

		// Get current ETag if available for conditional request
		const existing = await getOfflineTemplate(systemKey);
		const headers: Record<string, string> = {};
		if (existing?.etag) {
			headers['If-None-Match'] = existing.etag;
		}

		// Fetch template from server
		const templateRes = await fetch(`${templatePath}?placeholder=${encodeURIComponent(placeholder)}`, {
			credentials: 'include',
			headers,
		});

		// 304 Not Modified: reuse existing template, just update timestamp
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

			logDebug('Offline template unchanged (304)', { systemKey });
			return existing;
		}

		// If response not successful, abort refresh
		if (!templateRes.ok) {
			logWarn('Failed to fetch offline template', templateRes.status, templateRes.statusText);
			return null;
		}

		// Parse template HTML and metadata
		const html = await templateRes.text();
		const rec: OfflineTemplateRecord = {
			html,
			etag: getResponseEtag(templateRes),
			templatePath,
			placeholder,
			savedAt: Date.now(),
		};

		// Store updated template
		await db.system.put({ key: systemKey, value: rec });
		logDebug('Offline template stored', {
			systemKey,
			hasEtag: !!rec.etag,
			savedAt: rec.savedAt,
		});

		return rec;
	} catch (err) {
		logWarn('refreshOfflineTemplate failed', err);
		return null;
	}
}
