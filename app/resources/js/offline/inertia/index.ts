/**
 * Central export point for offline/inertia module.
 * Re-exports all public APIs from sub-modules.
 */

// Constants
export {
	ROOT_REDIRECT_SOURCE_PATH,
	OFFLINE_TEMPLATE_PATH,
	OFFLINE_TEMPLATE_PAGE_PLACEHOLDER,
	OFFLINE_TEMPLATE_SYSTEM_KEY,
} from './constants';

// Refresh and caching
export { getRefreshOptions, refreshAllExpired, cachePage } from './refresh';

// Route cacheability
export { isCachable, isCachableSync, getRouteList } from './routes';

// Page management
export { storePage, touchPage, getPage } from './pages';

// Version management
export { getLocalInertiaVersion, getRemoteInertiaVersion } from './version';

// Template management
export { getOfflineTemplate, refreshOfflineTemplate } from './template';

// Root redirect handling
export {
	setRootRedirect,
	getRootRedirect,
	getRootRedirectResponse,
	maybeRecordRootRedirect,
} from './redirects';

// Response generation
export { getCachedPageResponse, getOfflineNavigationResponse } from './responses';

// Data management
export { clearAllData } from './data';

// Fetch handler
export { createOfflineFetchHandler } from './fetch';

// Maintenance handlers
export { createOfflineMaintenanceHandlers } from './maintenance';

// Logging utilities
export { setDebugLogging } from './utils';

// Re-export types
export type {
	InertiaPage,
	RouteMeta,
	SystemKey,
	OfflineDatabase,
	CachedResponse,
	OfflineNavigationResponse,
	RequestType,
	CacheabilityCheck,
	RequestContext,
	RouteCheckFunction,
	RouteSyncCheckFunction,
	LogLevel,
	LogOptions,
	Result,
	OfflineHtmlBuilder,
} from './types';
