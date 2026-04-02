<?php
namespace app\modules\offline;

use Attribute;
use Closure;

#[Attribute(Attribute::TARGET_METHOD)]
class OfflineCacheable {
	public $param_generator;
	public $pagination_resolver;
	public $access_control;

	/**
	 * @param int $ttl Minimum time between refreshes, in seconds.
	 * @param callable|array|string|Closure|null $param_generator A callable that generates route parameter sets for offline cache expansion.
	 * @param mixed $pagination_resolver Framework-specific pagination resolver configuration. Null disables pagination expansion.
	 * @param callable|array|string|Closure|null $access_control A callable that determines if the route should be included. If a callable returns false, the route is omitted from the cache list.
	 */
	public function __construct(
		public int $ttl = 86400,
		callable|array|string|Closure|null $param_generator = null,
		mixed $pagination_resolver = null,
		callable|array|string|Closure|null $access_control = null,
	) {
		if ($param_generator !== null) {
			$this->param_generator = $param_generator;
		}
		if ($pagination_resolver !== null) {
			$this->pagination_resolver = $pagination_resolver;
		}
		if ($access_control !== null) {
			$this->access_control = $access_control;
		}
	}
}