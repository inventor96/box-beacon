<?php
namespace app\policies;

use app\models\Item;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class ItemPolicy extends Policy {
	public function view(?UserEntityInterface $user, Item $item) {
		return $user !== null && $item->box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, Item $item) {
		return $user !== null && $item->box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, Item $item) {
		return $user !== null && $item->box->move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}