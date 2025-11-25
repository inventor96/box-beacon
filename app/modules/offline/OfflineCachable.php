<?php
namespace app\modules\offline;

use Attribute;
use Closure;

#[Attribute(Attribute::TARGET_METHOD)]
class OfflineCachable {
	public $param_generator;

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