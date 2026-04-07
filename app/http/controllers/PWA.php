<?php
namespace app\http\controllers;

class PWA extends ControllerBase {
	public function onlineCheck() {
		$this->response->headers->add('Cache-Control', 'no-store, must-revalidate, private', true);
		return $this->jsonResponse(['status' => 'ok']);
	}
}