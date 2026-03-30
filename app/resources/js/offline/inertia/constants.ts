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

/** Endpoint path for fetching the offline template */
export const OFFLINE_TEMPLATE_PATH: string = '/pwa/offline-template';

/** Placeholder string in the offline template for inserting page content */
export const OFFLINE_TEMPLATE_PAGE_PLACEHOLDER: string = 'INERTIA_PAGE';

/** System key for storing the offline template */
export const OFFLINE_TEMPLATE_SYSTEM_KEY: string = `offlineTemplate:v1:${OFFLINE_TEMPLATE_PATH}:${OFFLINE_TEMPLATE_PAGE_PLACEHOLDER}`;

/** Maximum number of concurrent page refresh operations */
export const REFRESH_CONCURRENCY: number = 4;

/** Delay in milliseconds between staggered refresh operations */
export const REFRESH_STAGGER: number = 500;
