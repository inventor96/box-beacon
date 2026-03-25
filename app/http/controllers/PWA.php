<?php
namespace app\http\controllers;

use app\modules\offline\OfflineRoutes;
use mako\file\FileSystem;
use mako\http\exceptions\NotFoundException;

class PWA extends ControllerBase {
	/**
	 * TTL for cacheable routes metadata, in seconds
	 */
	private const ROUTES_META_TTL = 86400; // 1 day

	public function manifest(FileSystem $fs) {
		$path = __DIR__ . '/../../../public/build/manifest.webmanifest';

		// check if the manifest file exists
		if (!$fs->has($path))
		{
			throw new NotFoundException('The requested manifest file does not exist.');
		}

		// set response headers
		$info = $fs->info($path);
		$this->response->setType('application/manifest+json');
		$this->response->setCharset($info->getMimeEncoding());
		$this->response->headers->add('Content-Length', (string) $info->getSize(), true);

		// send the file
		$file = $fs->file($path);
		$file->rewind();
		$file->fpassthru();
		return null;
	}

	public function serviceWorker(FileSystem $fs) {
		$path = __DIR__ . '/../../../public/build/sw.js';

		// check if the service worker file exists
		if (!$fs->has($path))
		{
			throw new NotFoundException('The requested service worker file does not exist.');
		}

		// set response headers
		$info = $fs->info($path);
		$this->response->setType('application/javascript' /* $info->getMimeType() */);
		$this->response->setCharset($info->getMimeEncoding());
		$this->response->headers->add('Content-Length', (string) $info->getSize(), true);
		$this->response->headers->add('Service-Worker-Allowed', '/');

		// send the file
		$file = $fs->file($path);
		$file->rewind();
		$file->fpassthru();
		return null;
	}

	public function workbox(FileSystem $fs, string $version) {
		$path = __DIR__ . "/../../../public/build/workbox-$version.js";

		// check if the workbox file exists
		if (!$fs->has($path))
		{
			throw new NotFoundException('The requested Workbox file does not exist.');
		}

		// set response headers
		$info = $fs->info($path);
		$this->response->setType('application/javascript' /* $info->getMimeType() */);
		$this->response->setCharset($info->getMimeEncoding());
		$this->response->headers->add('Content-Length', (string) $info->getSize(), true);

		// send the file
		$file = $fs->file($path);
		$file->rewind();
		$file->fpassthru();
		return null;
	}

	public function onlineCheck() {
		$this->response->headers->add('Cache-Control', 'no-store, must-revalidate, private', true);
		return $this->jsonResponse(['status' => 'ok']);
	}

	public function offlineRoutes(OfflineRoutes $offline) {
		// disallow guests
		if (!$this->getUser()) {
			return $this->jsonResponse([
				'ttl' => self::ROUTES_META_TTL,
				'routes' => [],
			], status: 403);
		}

		$this->response->headers->add('Cache-Control', 'no-store, must-revalidate, private', true);

		// TODO: figure out limiting routes based on user permissions
		$routes = $offline->generateRoutes();
		return $this->jsonResponse([
			'ttl' => self::ROUTES_META_TTL,
			'routes' => $routes,
		]);
	}

	public function version() {
		$this->response->headers->add('Cache-Control', 'no-store, must-revalidate, private', true);

		$version = $this->config->get('inertia::version.0');
		return $this->jsonResponse(['version' => $version]);
	}
}