/**
 * Retrieves the ETag from a response.
 * @param {Response} response - The response object.
 * @returns {string|null} The ETag value, or null if not found.
 */
export function getResponseEtag(response) {
	return response.headers.get('ETag');
}
