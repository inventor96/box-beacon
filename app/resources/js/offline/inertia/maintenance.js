import { clearAllData } from './data.js';
import { getRefreshOptions, refreshAllExpired } from './refresh.js';
import { getRouteList } from './routes.js';
import { logDebug, logWarn } from './utils.js';

const DEFAULT_PERIODIC_SYNC_TAGS = new Set(['inertia-refresh', 'inertia-refresh:default']);
const DEFAULT_PUSH_REFRESH_TYPE = 'refresh-offline';

function resolveRefreshOptions(userOptions = {}) {
	const defaults = getRefreshOptions();
	return {
		...defaults,
		...(userOptions.refreshOptions || {}),
	};
}

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

export function createOfflineMaintenanceHandlers(userOptions = {}) {
	const refreshOptions = resolveRefreshOptions(userOptions);
	const periodicSyncTags = new Set(userOptions.periodicSyncTags || DEFAULT_PERIODIC_SYNC_TAGS);
	const pushRefreshType = userOptions.pushRefreshType || DEFAULT_PUSH_REFRESH_TYPE;

	let routeCacheWarmupPromise = null;
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

	if (userOptions.warmRouteListOnCreate !== false) {
		warmRouteCacheabilityIndex();
	}

	const refreshExpired = async () => refreshAllExpired(refreshOptions);
	const clearOfflineData = async () => clearAllData();

	const handleMessageEvent = (event) => {
		const { type } = event?.data || {};

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

	const handlePeriodicSyncEvent = (event) => {
		if (!periodicSyncTags.has(event.tag)) {
			return false;
		}

		event.waitUntil(refreshExpired());
		return true;
	};

	const handlePushEvent = (event) => {
		const data = parsePushData(event);
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