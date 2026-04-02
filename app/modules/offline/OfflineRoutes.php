<?php
namespace app\modules\offline;

use mako\config\Config;
use mako\http\routing\Route;
use mako\http\routing\Routes;
use mako\logger\Logger;
use mako\pagination\PaginationInterface;
use mako\syringe\Container;
use ReflectionFunction;
use ReflectionMethod;
use Throwable;

class OfflineRoutes {
	public function __construct(
		protected Routes $routes,
		protected Logger $logger,
		protected Container $container,
		protected Config $config,
	) {}

	public function generateRoutes(): array {
		$output = [];

		// loop through routes' actions
		/** @var Route[] */
		$routes = $this->routes->getRoutesByMethod('GET');
		foreach ($routes as $route) {
			$action = $route->getAction();
			$reflection = null;
			$attributes = [];

			// split string action into class/method
			if (is_string($action)) {
				if (strpos($action, '::') !== false) {
					$action = explode('::', $action, 2);
				} elseif (strpos($action, '@') !== false) {
					$action = explode('@', $action, 2);
				}
			}

			// reflect based on action type
			switch (ActionTypeEnum::from($action)) {
				case ActionTypeEnum::METHOD:
					$reflection = new ReflectionMethod($action[0], $action[1]);
					break;
				case ActionTypeEnum::FUNCTION:
					$reflection = new ReflectionFunction($action);
					break;
				default:
					// unsupported action type
					$this->logger->warning('Skipping offline cache route generation for [ ' . $route->getRoute() . ' ] due to unsupported action type');
					continue 2;
			}

			// if the OfflineCacheable attribute isn't present, skip this route
			$attributes = $reflection->getAttributes(OfflineCacheable::class);
			if (count($attributes) === 0) {
				continue;
			}
			$attribute = $attributes[0]->newInstance();

			// check access control
			$has_access = true;
			if (isset($attribute->access_control) && ActionTypeEnum::isSupported($attribute->access_control)) {
				$has_access = (bool) $this->callAction($attribute->access_control);
			}

			// skip route if access is denied
			if (!$has_access) {
				continue;
			}

			// get param combos from attribute's param generator
			if (isset($attribute->param_generator) && ActionTypeEnum::isSupported($attribute->param_generator)) {
				$params = $this->callAction($attribute->param_generator);
				if (!is_iterable($params)) {
					$this->logger->warning('Skipping offline cache route generation for [ ' . $route->getRoute() . ' ] due to param generator returning a non-iterable result');
					continue;
				}

				// process each param combo
				foreach ($params as $param_set) {
					if (!is_array($param_set)) {
						$this->logger->warning('Skipping param combo for offline cache route generation for [ ' . $route->getRoute() . ' ] due to param generator returning a non-array parameter set');
						continue;
					}

					$url = $this->buildRouteUrl($route, $param_set);
					if ($url === null) {
						continue;
					}

					array_push($output, ...$this->expandPaginationUrls($route, $url, $attribute, $param_set));
				}
			} else {
				// no param generator, just build the base URL and expand pagination if needed
				$url = $this->buildRouteUrl($route);
				if ($url === null) {
					continue;
				}

				array_push($output, ...$this->expandPaginationUrls($route, $url, $attribute));
			}
		}

		// return generated routes
		return $output;
	}

	/**
	 * Builds a URL for a route by replacing placeholders with provided parameters. If any required placeholders are missing, returns null. Extra parameters that don't correspond to placeholders are added as query parameters.
	 *
	 * @param Route $route The route for which to build the URL.
	 * @param array $param_set The parameters to replace in the route's placeholders.
	 * @return string|null The generated URL or null if required placeholders are missing.
	 */
	protected function buildRouteUrl(Route $route, array $param_set = []): ?string {
		$url = $route->getRoute();
		$query_params = [];

		foreach ($param_set as $key => $value) {
			$url = str_replace('{' . $key . '}', (string) $value, $url, $count);

			if ($count === 0) {
				$query_params[$key] = $value;
			}
		}

		// check for any remaining placeholders in the URL
		if (preg_match_all('/\{([^}]+)\}(\??)/', $url, $matches, PREG_SET_ORDER)) {
			$required_placeholders = [];
			foreach ($matches as $match) {
				// check if the placeholder is optional
				if (isset($match[2]) && $match[2] === '?') {
					// remove the optional placeholder from the URL
					$url = str_replace($match[0], '', $url);
				} else {
					// add required placeholder to the list
					$required_placeholders[] = $match[1];
				}
			}

			// log and skip if there are any missing required placeholders
			if (count($required_placeholders) > 0) {
				if (count($param_set) > 0) {
					$this->logger->warning('Skipping param combo for offline cache route generation for [ ' . $route->getRoute() . ' ] due to missing required parameters: ' . implode(', ', $required_placeholders));
				} else {
					$this->logger->warning('Skipping offline cache route generation for [ ' . $route->getRoute() . ' ] due to missing required parameters: ' . implode(', ', $required_placeholders));
				}

				return null;
			}
		}

		return $url . (count($query_params) > 0 ? '?' . http_build_query($query_params) : '');
	}

	/** Expands pagination URLs for a route based on the provided OfflineCacheable attribute's pagination resolver. If the pagination resolver is not set or returns an invalid result, only the base URL is returned.
	 *
	 * @param Route $route The route for which to expand pagination URLs.
	 * @param string $url The base URL for the route.
	 * @param OfflineCacheable $attribute The OfflineCacheable attribute instance containing pagination resolver configuration.
	 * @param array $route_params The parameters used for generating the base URL, which may be needed by the pagination resolver.
	 * @return array An array of route entries with URLs and TTLs, including pagination URLs if applicable.
	 */
	protected function expandPaginationUrls(Route $route, string $url, OfflineCacheable $attribute, array $route_params = []): array {
		// start with the base URL
		$output = [$this->makeRouteEntry($url, $attribute->ttl)];

		// if no pagination resolver is set, return just the base URL
		if (!isset($attribute->pagination_resolver)) {
			return $output;
		}

		// if the pagination resolver is false-y, just the base URL
		if (!$attribute->pagination_resolver) {
			$this->logger->warning('Skipping pagination expansion for offline cache route generation for [ ' . $route->getRoute() . ' ] due to a false-y pagination resolver');
			return $output;
		}

		// resolve pagination resolver action; return just the base URL if the resolver can't be resolved
		$pagination_resolver = $this->resolveAction($attribute->pagination_resolver);
		if ($pagination_resolver === null) {
			$this->logger->warning('Skipping pagination expansion for offline cache route generation for [ ' . $route->getRoute() . ' ] due to an unsupported pagination resolver action type');
			return $output;
		}

		try {
			// call pagination resolver to get pagination instance
			$pagination = $this->container->call($pagination_resolver, [
				'route_params' => $route_params,
				'url' => $url,
				'route' => $route,
			]);
		} catch (Throwable $e) {
			// log resolver failure and return just the base URL
			$this->logger->warning('Skipping pagination expansion for offline cache route generation for [ ' . $route->getRoute() . ' ] due to resolver failure: ' . $e->getMessage());
			return $output;
		}

		// if resolver doesn't return a PaginationInterface instance, log and return just the base URL
		if (!$pagination instanceof PaginationInterface) {
			$this->logger->warning('Skipping pagination expansion for offline cache route generation for [ ' . $route->getRoute() . ' ] due to the resolver not returning a PaginationInterface instance');
			return $output;
		}

		// generate URLs for each page in the pagination and add to output
		$page_key = (string) $this->config->get('pagination.page_key', 'page'); // 'page' is the default page key in Mako
		$total_pages = max($pagination->numberOfPages(), 1);
		for ($page = 1; $page <= $total_pages; $page++) {
			$output[] = $this->makeRouteEntry($this->appendQueryParam($url, $page_key, (string) $page), $attribute->ttl);
		}

		return $output;
	}

	/** Calls a given action with parameters using the container. The action can be a callable or an array representing a class method. If the action type is unsupported, null is returned.
	 *
	 * @param mixed $action The action to call, which can be a callable or an array [class, method].
	 * @param array $parameters The parameters to pass to the action when calling it.
	 * @return mixed The result of the action call, or null if the action type is unsupported.
	 */
	protected function callAction(mixed $action, array $parameters = []): mixed {
		$resolved_action = $this->resolveAction($action);
		return $resolved_action === null ? null : $this->container->call($resolved_action, $parameters);
	}

	/**
	 * Resolves an action into a callable that can be invoked. Supports both function callables and class method arrays. For class method arrays, if the first element is not already an object instance, it attempts to resolve it from the container. If the action type is unsupported, null is returned.
	 *
	 * @param mixed $action The action to resolve, which can be a callable or an array [class, method].
	 * @return callable|null The resolved callable action, or null if the action type is unsupported.
	 * @throws Throwable If resolving the action from the container fails.
	 */
	protected function resolveAction(mixed $action): mixed {
		switch (ActionTypeEnum::from($action)) {
			case ActionTypeEnum::METHOD:
				// if the first element is not an object instance, attempt to resolve it from the container
				if (!is_object($action[0])) {
					$action[0] = $this->container->get($action[0]);
				}
			case ActionTypeEnum::FUNCTION:
				return $action;
			default:
				return null;
		}
	}

	/** Helper method to create a route entry with URL and TTL.
	 *
	 * @param string $url The URL for the route entry.
	 * @param int $ttl The time-to-live for the cache in seconds.
	 * @return array An associative array representing the route entry with 'url' and 'ttl' keys.
	 */
	protected function makeRouteEntry(string $url, int $ttl): array {
		return [
			'url' => $url,
			'ttl' => $ttl,
		];
	}

	/** Appends a query parameter to a URL, correctly handling whether the URL already has existing query parameters.
	 *
	 * @param string $url The original URL to which the query parameter should be appended.
	 * @param string $key The key of the query parameter to append.
	 * @param string $value The value of the query parameter to append.
	 * @return string The URL with the appended query parameter.
	 */
	protected function appendQueryParam(string $url, string $key, string $value): string {
		return $url . (str_contains($url, '?') ? '&' : '?') . http_build_query([$key => $value]);
	}
}