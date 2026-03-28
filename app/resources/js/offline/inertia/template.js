import { db } from './db.js';
import { getResponseEtag, logDebug, logWarn } from './utils.js';

/**
 * Retrieves the offline template for the given system key.
 * @param {string} systemKey - The system key of the offline template.
 * @returns {Promise<Object|null>} A promise that resolves to the offline template, or null if not found.
 */
export async function getOfflineTemplate(systemKey) {
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
 * Refreshes the offline template for the given system key.
 * @param {string} templatePath - The path to the offline template.
 * @param {string} placeholder - The placeholder for the offline template.
 * @param {string} systemKey - The system key of the offline template.
 * @returns {Promise<Object|null>} A promise that resolves to the refreshed offline template, or null if the refresh fails.
 */
export async function refreshOfflineTemplate(templatePath, placeholder, systemKey) {
	// require all inputs
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

		// get the current ETag if available
		const existing = await getOfflineTemplate(systemKey);
		const headers = {};
		if (existing?.etag) {
			headers['If-None-Match'] = existing.etag;
		}

		// fetch the offline template from the server
		const templateRes = await fetch(`${templatePath}?placeholder=${encodeURIComponent(placeholder)}`, {
			credentials: 'include',
			headers,
		});

		// if we get a 304 Not Modified response, we can reuse the existing template
		// and just update the savedAt timestamp
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

		// if the response is not successful, we can't refresh the template
		if (!templateRes.ok) {
			logWarn('Failed to fetch offline template', templateRes.status, templateRes.statusText);
			return null;
		}

		// parse the template HTML and ETag from the response
		const html = await templateRes.text();
		const rec = {
			html,
			etag: getResponseEtag(templateRes),
			templatePath,
			placeholder,
			savedAt: Date.now(),
		};

		// store the refreshed template in the database
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
