<?php
namespace app\modules\offline;

use mako\gatekeeper\Gatekeeper;

class ParamGenerator {
	public static function userMovesParams(Gatekeeper $gatekeeper): array {
		$params = [];
		$moves = $gatekeeper->getUser()->moves()->all();
		foreach ($moves as $move) {
			$params[] = ['move_id' => $move->id];
		}
		return $params;
	}
}