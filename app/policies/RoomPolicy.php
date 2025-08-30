<?php
namespace app\policies;

use app\models\Room;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class RoomPolicy extends Policy {
	public function view(?UserEntityInterface $user, Room $room) {
		return $user !== null && $room->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, Room $room) {
		return $user !== null && $room->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, Room $room) {
		return $user !== null && $room->move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}