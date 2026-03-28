import { db } from './db.js';
import { ROUTE_VERSION_PATH } from './constants.js';
import { clearAllData } from './data.js';
import { logDebug, logWarn } from './utils.js';

/**
 * Retrieves the local Inertia version stored in the database.
 * @returns {Promise<string|null>} The local Inertia version stored in the database, or null if not available.
 */
export async function getLocalInertiaVersion() {
	const rec = await db.system.get('inertiaVersion');
	return rec ? rec.value : null;
}

/**
 * Fetches the current Inertia version from the server and updates the local cache.
 * @returns {Promise<string|null>} The remote Inertia version fetched from the server, or null if the fetch fails.
 */
export async function getRemoteInertiaVersion() {
	try {
		// fetch the Inertia version from the server
		const res = await fetch(ROUTE_VERSION_PATH, { credentials: 'include' });
		if (!res.ok) {
			logWarn('Failed to fetch inertia version', res.statusText);
			return null;
		}

		// parse the version from the response and update the local cache
		const data = await res.json();
		await db.system.put({ key: 'inertiaVersion', value: data.version });

		return data.version || null;
	} catch (err) {
		logWarn('getInertiaVersion failed', err);
		return null;
	}
}

/**
 * Ensures the Inertia version is up-to-date, optionally forcing a refresh.
 * @param {Object} options - The options for ensuring the Inertia version.
 * @param {boolean} [options.forceRefresh=false] - Whether to force a refresh of the Inertia version.
 * @returns {Promise<string|null>} The ensured Inertia version, or null if unavailable.
 */
export async function ensureInertiaVersion(options = {}) {
	// extract options with defaults
	const { forceRefresh = false } = options;

	// get the local version from the database
	const localVersion = await getLocalInertiaVersion();

	// if we have a local version and we're not forcing a refresh, return it
	if (!forceRefresh && localVersion) {
		logDebug('Reusing local Inertia version', { localVersion });
		return localVersion;
	}

	logDebug('Refreshing Inertia version before backend cache update requests', {
		forceRefresh,
		localVersion,
	});

	// fetch the remote version from the server
	const remoteVersion = await getRemoteInertiaVersion();

	if (remoteVersion) {
		// if we got a remote version, compare it to the local version and clear cache if it has changed
		if (remoteVersion !== localVersion) {
			logWarn('Inertia version changed; clearing offline cache before downloading updates', {
				localVersion,
				remoteVersion,
			});
			await clearAllData();
			await db.system.put({ key: 'inertiaVersion', value: remoteVersion });
		}

		logDebug('Updated Inertia version for refresh work', { remoteVersion });
		return remoteVersion;
	}

	logWarn('Failed to refresh Inertia version; falling back to local version if available', {
		localVersion,
	});
	return localVersion;
}
