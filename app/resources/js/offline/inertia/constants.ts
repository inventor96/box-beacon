/**
 * Constants for the offline/inertia module.
 * Centralized configuration values for PWA offline caching.
 */

/** Endpoint path for fetching offline-cacheable routes */
export const ROUTE_META_PATH: string = '/pwa/offline-routes';

/** Endpoint path for fetching the current Inertia version */
export const ROUTE_VERSION_PATH: string = '/pwa/offline-version';

/** Key prefix for storing root URL redirect information */
export const ROOT_REDIRECT_KEY_PREFIX: string = 'rootRedirect:';

/** The source path for root redirects (the root URL) */
export const ROOT_REDIRECT_SOURCE_PATH: string = '/';

/** Path to fetch the offline template from (default: /) */
export const OFFLINE_TEMPLATE_FETCH_PATH: string = '/';

/** CSS selector for the Inertia page data element (default: [data-page]) */
export const OFFLINE_TEMPLATE_ELEMENT_SELECTOR: string = '[data-page]';

/** Prefix for system keys storing offline templates, followed by fetch path and selector */
export const OFFLINE_TEMPLATE_SYSTEM_KEY_PREFIX: string = 'offlineTemplate:v2';

/** Maximum number of concurrent page refresh operations */
export const REFRESH_CONCURRENCY: number = 4;

/** Delay in milliseconds between staggered refresh operations */
export const REFRESH_STAGGER: number = 500;
