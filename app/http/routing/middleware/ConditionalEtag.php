<?php
namespace app\http\routing\middleware;

use Closure;
use mako\http\Request;
use mako\http\Response;
use mako\http\response\builders\JSON;
use mako\http\response\builders\ResponseBuilderInterface;
use mako\http\response\senders\ResponseSenderInterface;
use mako\http\routing\middleware\MiddlewareInterface;

class ConditionalEtag implements MiddlewareInterface {
	private const ROUTE_LIST_PATH = '/pwa/offline-routes';

	public function execute(Request $request, Response $response, Closure $next): Response {
		// process the request first
		$response = $next($request, $response);

		// only apply to GET requests
		if ($request->getMethod() !== 'GET') {
			return $response;
		}

		// if the body is a JSON response for the offline routes endpoint, build it to get the final body content for ETag generation
		$body = $response->getBody();
		if ($body instanceof JSON && $this->isOfflineRoutesRequest($request)) {
			$body->build($request, $response);
			$body = $response->getBody();
		}

		// determine if we should apply ETag
		if (!$this->shouldApplyEtag($request, $response, $body)) {
			return $response;
		}

		// generate ETag from body content and add to response headers
		$etag = '"' . hash('sha256', (string) $body) . '"';
		$response->headers->add('ETag', $etag);

		// if the request has a matching ETag, return 304 Not Modified with no body
		$requestEtag = trim((string) $request->headers->get('If-None-Match', ''));
		if ($requestEtag !== '' && str_replace('-gzip', '', $requestEtag) === $etag) {
			$response->setStatus(304);
			$response->setBody('');
			$response->headers->remove('Content-Length');
		}

		return $response;
	}

	/**
	 * Determine if we should apply ETag based on response status, body type, and whether it's an Inertia JSON response or the offline routes JSON response
	 *
	 * @param Request $request The current HTTP request
	 * @param Response $response The current HTTP response
	 * @param mixed $body The response body
	 * @return boolean True if ETag should be applied, false otherwise
	 */
	private function shouldApplyEtag(Request $request, Response $response, mixed $body): bool {
		// only apply ETag for successful responses
		if ($response->getStatus()->value !== 200) {
			return false;
		}

		// do not apply ETag if the body is a response sender or builder, as these may not have been built yet and could lead to incorrect ETag generation
		if ($body instanceof ResponseSenderInterface || $body instanceof ResponseBuilderInterface) {
			return false;
		}

		// only apply ETag if the body is a string or can be cast to a string, as ETag is generated from the body content; this also avoids issues with generating ETags for non-string bodies like streams or file objects
		if (!is_scalar($body) && !(is_object($body) && method_exists($body, '__toString'))) {
			return false;
		}

		// only apply ETag for Inertia JSON responses or the offline routes JSON response, as these are the primary candidates for caching and conditional requests in our app
		return $this->isInertiaJsonResponse($request, $response)
			|| $this->isOfflineRoutesResponse($request, $response);
	}

	/**
	 * Determine if the response is an Inertia JSON response based on request headers and response content type
	 *
	 * @param Request $request The current HTTP request
	 * @param Response $response The current HTTP response
	 * @return boolean True if it's an Inertia JSON response, false otherwise
	 */
	private function isInertiaJsonResponse(Request $request, Response $response): bool {
		return $request->headers->get('X-Inertia')
			&& $response->getType() === 'application/json'
			&& $response->headers->hasValue('X-Inertia', 'true', false);
	}

	/**
	 * Determine if the response is the offline routes JSON response based on request path and response content type
	 *
	 * @param Request $request The current HTTP request
	 * @param Response $response The current HTTP response
	 * @return boolean True if it's the offline routes JSON response, false otherwise
	 */
	private function isOfflineRoutesResponse(Request $request, Response $response): bool {
		return $this->isOfflineRoutesRequest($request)
			&& $response->getType() === 'application/json';
	}

	/**
	 * Determine if the request is for the offline routes endpoint based on the request path
	 *
	 * @param Request $request The current HTTP request
	 * @return boolean True if it's a request for the offline routes endpoint, false otherwise
	 */
	private function isOfflineRoutesRequest(Request $request): bool {
		return $request->getPath() === self::ROUTE_LIST_PATH;
	}
}