<?php
namespace app\modules\offline;

use Attribute;
use Closure;

#[Attribute(Attribute::TARGET_METHOD)]
class OfflineCachable {
	public $param_generator;

	/**
	 * @param int $ttl Minimum time between refreshes, in seconds.
	 * @param bool $paginated Whether this route is paginated (i.e. has a "page" query parameter). If true, the service worker will cache each page separately.
	 * @param callable|array|string|Closure|null $param_generator A callable that generates additional parameters to be stored with the cached response. This can be used to store additional metadata about the request
	 */
	public function __construct(
		public int $ttl = 86400,
		public bool $paginated = false,
		callable|array|string|Closure|null $param_generator = null,
	) {
		if ($param_generator !== null) {
			$this->param_generator = $param_generator;
		}
	}
}