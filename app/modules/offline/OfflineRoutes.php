<?php
namespace app\modules\offline;

use app\models\User;
use Closure;
use mako\http\routing\Route;
use mako\http\routing\Routes;
use mako\logger\Logger;
use mako\syringe\Container;
use ReflectionFunction;
use ReflectionMethod;

class OfflineRoutes {
	public function __construct(
		protected Routes $routes,
		protected Logger $logger,
		protected Container $container,
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
			if (
				is_array($action)
				&& count($action) === 2
				&& (
					is_object($action[0])
					|| is_string($action[0])
				)
				&& is_string($action[1])
				&& method_exists($action[0], $action[1])
			) {
				// class method
				$reflection = new ReflectionMethod($action[0], $action[1]);
			} elseif ($action instanceof Closure || (is_string($action) && function_exists($action))) {
				// closure or function name
				$reflection = new ReflectionFunction($action);
			} else {
				// unsupported action type
				$this->logger->warning('Skipping offline cache route generation for [ ' . $route->getRoute() . ' ] due to unsupported action type');
				continue;
			}

			// if the OfflineCachable attribute is present, generate params and add to output
			$attributes = $reflection->getAttributes(OfflineCachable::class);
			if (count($attributes) === 0) {
				continue;
			}
			$attribute = $attributes[0]->newInstance();

			// get param combos from attribute's param generator
			if (isset($attribute->param_generator) && is_callable($attribute->param_generator)) {
				// process each param combo
				$params = $this->container->call($attribute->param_generator);
				foreach ($params as $param_set) {
					// build route path
					$path = $route->getRoute();
					$query_params = [];
					foreach ($param_set as $key => $value) {
						// replace param placeholder with value
						$path = str_replace('{' . $key . '}', $value, $path, $count);
	
						// if no replacement was made, append to query params
						if ($count === 0) {
							$query_params[$key] = $value;
						}
					}
	
					// check for leftover placeholders
					if (preg_match_all('/\{([^}]+)\}(\??)/', $path, $matches, PREG_SET_ORDER)) {
						$required_placeholders_left = [];
						foreach ($matches as $match) {
							// if the placeholder is optional, remove it
							if (isset($match[2]) && $match[2] === '?') {
								$path = str_replace($match[0], '', $path);
							} else {
								// required placeholder left unfilled
								$required_placeholders_left[] = $match[1];
							}
						}
	
						// if any required placeholders are left, skip this param set
						if (count($required_placeholders_left) > 0) {
							$this->logger->warning('Skipping param combo for offline cache route generation for [ ' . $route->getRoute() . ' ] due to missing required parameters: ' . implode(', ', $required_placeholders_left));
							continue;
						}
					}
	
					// add to output
					$output[] = [
						'path' => $path . (count($query_params) > 0 ? '?' . http_build_query($query_params) : ''),
						'ttl' => $attribute->ttl,
						'paginated' => $attribute->paginated,
					];
				}
			} else {
				// no param generator, check for placeholders
				if (preg_match_all('/\{([^}]+)\}(\??)/', $route->getRoute(), $matches, PREG_SET_ORDER)) {
					$required_placeholders = [];
					foreach ($matches as $match) {
						// if the placeholder is required, note it
						if (!isset($match[2]) || $match[2] !== '?') {
							$required_placeholders[] = $match[1];
						}
					}

					// if any required placeholders are left, skip this param set
					if (count($required_placeholders) > 0) {
						$this->logger->warning('Skipping offline cache route generation for [ ' . $route->getRoute() . ' ] due to missing required parameters: ' . implode(', ', $required_placeholders));
						continue;
					}
				}

				// add the route as-is
				$output[] = [
					'path' => $route->getRoute(),
					'ttl' => $attribute->ttl,
					'paginated' => $attribute->paginated,
				];
			}
		}

		// return generated routes
		return $output;
	}
}