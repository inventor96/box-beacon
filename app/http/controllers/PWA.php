<?php
namespace app\http\controllers;

use app\modules\offline\OfflineRoutes;
use mako\file\FileSystem;
use mako\http\exceptions\NotFoundException;

class PWA extends ControllerBase {
	public function serviceWorker(FileSystem $fs) {
		$path = __DIR__ . '/../../../public/build/sw.js';

		// check if the service worker file exists
		if (!$fs->has($path))
		{
			throw new NotFoundException('The requested service worker file does not exist.');
		}

		// set response headers
		$info = $fs->info($path);
		$this->response->setType($info->getMimeType());
		$this->response->setCharset($info->getMimeEncoding());
		$this->response->headers->add('Content-Length', (string) $info->getSize(), true);
		$this->response->headers->add('Service-Worker-Allowed', '/');

		// send the file
		$file = $fs->file($path);
		$file->rewind();
		$file->fpassthru();
		return null;
	}

	public function onlineCheck() {
		return $this->jsonResponse(['status' => 'ok']);
	}

	public function offlineRoutes(OfflineRoutes $offline) {
		// disallow guests
		if (!$this->getUser()) {
			return $this->jsonResponse([], status: 403);
		}

		// TODO: figure out limiting routes based on user permissions
		$routes = $offline->generateRoutes();
		return $this->jsonResponse($routes);
	}

	public function version() {
		$version = $this->config->get('inertia::version.0');
		return $this->jsonResponse(['version' => $version]);
	}
}