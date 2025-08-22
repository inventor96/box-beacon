<?php
namespace app\models;

use mako\http\Request;
use mako\http\routing\URLBuilder;

class NavLinkFactory {
	protected Request $request;
	protected URLBuilder $builder;

	public function __construct(Request $request, URLBuilder $builder) {
		$this->request = $request;
		$this->builder = $builder;
	}

	/**
	 * Generates a new NavLink instance.
	 *
	 * @param string $name
	 * @param string $path
	 * @param bool $active
	 * @return NavLink
	 */
	public function create(string $name, string $path, bool $active): NavLink {
		return new NavLink($name, $path, $active);
	}

	/**
	 * Generates a NavLink, setting the path and active status based on the route name.
	 *
	 * @param string $name
	 * @param string $route_name
	 * @return NavLink
	 */
	public function createFromRoute(string $name, string $route_name): NavLink {
		return $this->create(
			$name,
			$this->builder->toRoute($route_name),
			$this->request->getRoute()->getName() === $route_name
		);
	}

	/**
	 * Creates a dropdown navlink using route names.
	 *
	 * @param string $name
	 * @param array $dropdowns In the format [ ['<name>', '<route_name>'], ... ]
	 * @return NavLink
	 */
	public function createDropdownFromRoutes(string $name, array $dropdowns): NavLink {
		$root = new NavLink($name, '', false);
		$root->dropdown(
			...array_map(
				function($d) {
					return $this->createFromRoute($d[0], $d[1]);
				},
			$dropdowns)
		);
		$root->active = count(
			array_filter(
				$root->getDropdowns(),
				function(NavLink $d) {
					return $d->active;
				}
			)
		) > 0;
		return $root;
	}
}