<?php
namespace app\models;

class NavLinks {
	protected ?User $user;
	protected NavLinkFactory $nav;

	public function __construct(NavLinkFactory $nav, ?User $user) {
		$this->nav = $nav;
		$this->user = $user;
	}

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
			$this->nav->createFromRoute('Boxes', 'boxes:home'),
			$this->nav->createFromRoute('Moves', 'moves:home'),
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
				$this->nav->createFromRoute('Log In', 'auth:login'),
			];
		}

		// logged in
		return [
			$this->nav->createFromRoute('Account', 'account:home'),
			$this->nav->createFromRoute('Log Out', 'auth:logout'),
		];
	}
}