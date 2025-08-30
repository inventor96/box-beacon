<?php
namespace app\policies;

use app\models\Box;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class BoxPolicy extends Policy {
	public function view(?UserEntityInterface $user, Box $box) {
		return $user !== null && $box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, Box $box) {
		return $user !== null && $box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, Box $box) {
		return $user !== null && $box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}