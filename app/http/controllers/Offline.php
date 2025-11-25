<?php
namespace app\http\controllers;

use app\modules\offline\OfflineRoutes;

class Offline extends ControllerBase {
	public function index(OfflineRoutes $offline) {
		$routes = $offline->generateRoutes();
		return $this->jsonResponse($routes);
	}
}