<?php
namespace app\http\controllers;

use app\modules\offline\OfflineRoutes;

class Offline extends ControllerBase {
	public function index(OfflineRoutes $offline) {
		// disallow guests
		if (!$this->getUser()) {
			return $this->jsonResponse([], 403);
		}

		$routes = $offline->generateRoutes();
		return $this->jsonResponse($routes);
	}

	public function version() {
		$version = $this->config->get('inertia::version.0');
		return $this->jsonResponse(['version' => $version]);
	}
}