<?php
namespace app\policies;

use app\models\Move;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class MovePolicy extends Policy {
	public function view(?UserEntityInterface $user, Move $move) {
		return $user !== null && $move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, Move $move) {
		return $user !== null && $move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, Move $move) {
		return $user !== null && $move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}