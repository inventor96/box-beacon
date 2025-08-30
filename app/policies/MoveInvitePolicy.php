<?php
namespace app\policies;

use app\models\MoveInvite;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class MoveInvitePolicy extends Policy {
	public function view(?UserEntityInterface $user, MoveInvite $moveinvite) {
		return $user !== null && $moveinvite->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, MoveInvite $moveinvite) {
		return $user !== null && $moveinvite->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, MoveInvite $moveinvite) {
		return $user !== null && $moveinvite->move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}