import { clearAllData } from './data.js';
import { getRefreshOptions, refreshAllExpired } from './refresh.js';
import { getRouteList } from './routes.js';
import { logDebug, logWarn } from './utils.js';

const DEFAULT_PERIODIC_SYNC_TAGS = new Set(['inertia-refresh', 'inertia-refresh:default']);
const DEFAULT_PUSH_REFRESH_TYPE = 'refresh-offline';

/**
 * Resolves the refresh options by merging user-defined options with the default options.
 * @param {Object} userOptions User-defined options for configuring the refresh behavior.
 * @returns {Object} The resolved refresh options.
 */
function resolveRefreshOptions(userOptions = {}) {
	const defaults = getRefreshOptions();
	const refreshOptions = {
		...defaults,
		...(userOptions.refreshOptions || {}),
	};
	logDebug('Resolved refresh options', refreshOptions);
	return refreshOptions;
}

/**
 * Parses the data from a push event.
 * @param {PushEvent} event The push event.
 * @returns {Object} The parsed data from the push event.
 */
function parsePushData(event) {
	if (!event?.data || typeof event.data.json !== 'function') {
		return {};
	}

	try {
		return event.data.json() || {};
	} catch (err) {
		logWarn('Failed to parse push payload JSON', err);
		return {};
	}
}

/**
 * Creates offline maintenance handlers for managing offline data and events.
 * @param {Object} userOptions User-defined options for configuring the maintenance handlers.
 * @param {boolean} [userOptions.warmRouteListOnCreate=true] Whether to warm the route list on creation.
 * @param {Set<string>} [userOptions.periodicSyncTags] Custom tags for periodic sync events.
 * @param {string} [userOptions.pushRefreshType] Custom type for push refresh events.
 * @param {string} [userOptions.templatePath] Custom path for the offline template.
 * @param {string} [userOptions.templatePlaceholder] Custom placeholder for the offline template.
 * @param {string} [userOptions.templateSystemKey] Custom system key for the offline template.
 * @param {string} [userOptions.rootRedirectPath] Custom path for the root redirect.
 * @returns {Object} An object containing the maintenance handler functions.
 */
export function createOfflineMaintenanceHandlers(userOptions = {}) {
	const refreshOptions = resolveRefreshOptions(userOptions);
	const periodicSyncTags = new Set(userOptions.periodicSyncTags || DEFAULT_PERIODIC_SYNC_TAGS);
	const pushRefreshType = userOptions.pushRefreshType || DEFAULT_PUSH_REFRESH_TYPE;

	let routeCacheWarmupPromise = null;

	/**
	 * Warms up the route cacheability index by fetching the route list and
	 * populating the in-memory index.
	 * @returns {Promise<boolean>} Resolves to true if the route cacheability index was warmed successfully, false otherwise.
	 */
	const warmRouteCacheabilityIndex = () => {
		if (!routeCacheWarmupPromise) {
			routeCacheWarmupPromise = getRouteList()
				.then(() => {
					logDebug('Route cacheability index warmed by maintenance handlers');
					return true;
				})
				.catch((err) => {
					logWarn('Failed to warm route cacheability index from maintenance handlers', err);
					return false;
				});
		}

		return routeCacheWarmupPromise;
	};

	/**
	 * Refreshes all expired offline data.
	 * @returns {Promise<void>} Resolves when all expired data has been refreshed.
	 */
	const refreshExpired = async () => refreshAllExpired(refreshOptions);

	/**
	 * Clears all offline data, including cached pages, route metadata, and system data.
	 * @returns {Promise<void>} Resolves when all offline data has been cleared.
	 */
	const clearOfflineData = async () => clearAllData();

	/**
	 * Handles message events from the frontend.
	 * @param {MessageEvent} event The message event.
	 * @returns {boolean} True if the event was handled, false otherwise.
	 */
	const handleMessageEvent = (event) => {
		const { type } = event?.data || {};
		logDebug('Maintenance handler received message event', { type, event });

		switch (type) {
			case 'CLEAR_OFFLINE':
				event.waitUntil(clearOfflineData());
				return true;
			case 'REFRESH_EXPIRED':
				event.waitUntil(refreshExpired());
				return true;
			default:
				return false;
		}
	};

	/**
	 * Handles periodic sync events from the browser.
	 * @param {Event} event The periodic sync event.
	 * @returns {boolean} True if the event was handled, false otherwise.
	 */
	const handlePeriodicSyncEvent = (event) => {
		logDebug('Maintenance handler received periodic sync event', { tag: event.tag });

		// only handle events with tags that match our configured refresh tags
		if (!periodicSyncTags.has(event.tag)) {
			return false;
		}

		event.waitUntil(refreshExpired());
		return true;
	};

	/**
	 * Handles push events from the browser.
	 * @param {PushEvent} event The push event.
	 * @returns {boolean} True if the event was handled, false otherwise.
	 */
	const handlePushEvent = (event) => {
		const data = parsePushData(event);
		logDebug('Maintenance handler received push event', { data });

		// only handle push events with the configured refresh type
		if (data?.type !== pushRefreshType) {
			return false;
		}

		event.waitUntil(refreshExpired());
		return true;
	};

	return {
		clearOfflineData,
		handleMessageEvent,
		handlePeriodicSyncEvent,
		handlePushEvent,
		refreshExpired,
		refreshOptions,
		warmRouteCacheabilityIndex,
	};
}