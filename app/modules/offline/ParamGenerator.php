<?php
namespace app\modules\offline;

use mako\gatekeeper\Gatekeeper;

class ParamGenerator {
	public function __construct(protected Gatekeeper $gatekeeper) {}

	// test instance method
	public function userMovesParams(): array {
		$params = [];
		$moves = $this->gatekeeper->getUser()->moves()->all();
		foreach ($moves as $move) {
			$params[] = ['move_id' => $move->id];
		}
		return $params;
	}

	// test static method
	public static function userBoxParams(Gatekeeper $gatekeeper): array {
		$params = [];
		$moves = $gatekeeper->getUser()->moves()->including(['boxes'])->all();
		foreach ($moves as $move) {
			foreach ($move->boxes as $box) {
				$params[] = ['move_id' => $move->id, 'id' => $box->id];
			}
		}
		return $params;
	}
}