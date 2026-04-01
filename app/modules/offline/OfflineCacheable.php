<?php
namespace app\modules\offline;

use Attribute;
use Closure;

#[Attribute(Attribute::TARGET_METHOD)]
class OfflineCacheable {
	public $param_generator;
	public $access_control;

	/**
	 * @param int $ttl Minimum time between refreshes, in seconds.
	 * @param bool $paginated Whether this route is paginated (i.e. has a "page" query parameter). If true, the service worker will cache each page separately.
	 * @param callable|array|string|Closure|null $param_generator A callable that generates additional parameters to be stored with the cached response. This can be used to store additional metadata about the request
	 * @param callable|array|string|Closure|null $access_control A callable that determines if the route should be included. If a callable returns false, the route is omitted from the cache list.
	 */
	public function __construct(
		public int $ttl = 86400,
		public bool $paginated = false,
		callable|array|string|Closure|null $param_generator = null,
		callable|array|string|Closure|null $access_control = null,
	) {
		if ($param_generator !== null) {
			$this->param_generator = $param_generator;
		}
		if ($access_control !== null) {
			$this->access_control = $access_control;
		}
	}
}