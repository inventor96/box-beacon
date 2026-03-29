/**
 * Retrieves the ETag from a response.
 * @param {Response} response - The response object.
 * @returns {string|null} The ETag value, or null if not found.
 */
export function getResponseEtag(response) {
	return response.headers.get('ETag');
}

const SHOULD_LOG_DEV = process.env.NODE_ENV === 'development';

/**
 * Formats log messages with a consistent prefix and styling for better visibility in the console.
 * @param {string} method - The console method to use (e.g., 'debug', 'log', 'warn', 'error').
 * @param {...*} args - Arguments to pass through to the console method.
 * @returns {Array} An array of arguments formatted for the console method.
 */
function withPrefix(method, args) {
	// styles from workbox
	const methodToColorMap = {
		debug: `#7f8c8d`,
		log: `#2ecc71`,
		warn: `#f39c12`,
		error: `#c0392b`,
	};
	const styles = [
		`background: ${methodToColorMap[method]}`,
		`border-radius: 0.5em`,
		`color: white`,
		`font-weight: bold`,
		`padding: 2px 0.5em`
	];

	return ['%cInertia Offline', styles.join(';'), ...args];
}

/**
 * Logs debug messages only during development builds.
 * @param {...*} args - Arguments to pass through to console.debug.
 */
export function logDebug(...args) {
	if (SHOULD_LOG_DEV) {
		console.debug(...withPrefix('debug', args));
	}
}

/**
 * Logs info messages only during development builds.
 * @param {...*} args - Arguments to pass through to console.info.
 */
export function logInfo(...args) {
	if (SHOULD_LOG_DEV) {
		console.info(...withPrefix('log', args));
	}
}

/**
 * Logs warning messages in all builds.
 * @param {...*} args - Arguments to pass through to console.warn.
 */
export function logWarn(...args) {
	console.warn(...withPrefix('warn', args));
}
