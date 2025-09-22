<?php
namespace app\models;

class NavLinks {
	public function __construct(
		protected NavLinkFactory $nav,
		protected ?User $user,
	) {}

	/**
	 * Generate the navbar links to show on the left side of the navbar
	 *
	 * @return NavLink[]
	 */
	public function generateLeftLinks(): array {
		// guest
		if ($this->user === null) {
			return [];
		}

		// logged in
		$links = [
			$this->nav->createFromRoute('Boxes', 'bi-boxes', 'boxes:home', ['move_id' => $this->user->active_move_id ?? 0]),
			$this->nav->createFromRoute('Items', 'bi-list-task', 'items:home', ['move_id' => $this->user->active_move_id ?? 0]),
			$this->nav->createFromRoute('Moves', 'bi-arrows-move', 'moves:home'),
			$this->nav->createFromRoute('Rooms', 'bi-door-open', 'rooms:home', ['move_id' => $this->user->active_move_id ?? 0]),
			$this->nav->createFromRoute('Tags', 'bi-tags', 'tags:home', ['move_id' => $this->user->active_move_id ?? 0]),
		];

		return $links;
	}

	/**
	 * Generates the navbar links to show on the right side of the navbar
	 *
	 * @return NavLink[]
	 */
	public function generateRightLinks(): array {
		// guest
		if ($this->user === null) {
			return [
				$this->nav->createFromRoute('Sign Up', 'bi-person-plus', 'auth:signup'),
				$this->nav->createFromRoute('Log In', 'bi-box-arrow-in-right', 'auth:login'),
			];
		}

		// logged in
		return [
			$this->nav->createFromRoute('Account', 'bi-person', 'account:home'),
			$this->nav->createFromRoute('Log Out', 'bi-box-arrow-right', 'auth:logout'),
		];
	}
}