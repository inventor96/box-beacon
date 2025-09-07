<?php
namespace app\policies;

use app\models\Tag;
use mako\gatekeeper\authorization\policies\Policy;
use mako\gatekeeper\entities\user\UserEntityInterface;

class TagPolicy extends Policy {
	public function view(?UserEntityInterface $user, Tag $tag) {
		return $user !== null && $tag->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function edit(?UserEntityInterface $user, Tag $tag) {
		return $user !== null && $tag->move->users()->where('id', '=', $user->getId())->count() > 0;
	}

	public function delete(?UserEntityInterface $user, Tag $tag) {
		return $user !== null && $tag->move->users()->where('id', '=', $user->getId())->count() > 0;
	}
}