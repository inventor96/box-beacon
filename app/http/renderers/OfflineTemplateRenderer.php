<?php
namespace app\http\renderers;

use inventor96\Inertia\InertiaRenderer;

class OfflineTemplateRenderer extends InertiaRenderer {
	/**
	 * Renders the configured Inertia HTML template with a caller-provided page placeholder.
	 */
	public function renderTemplateWithPlaceholder(string $pagePlaceholder): string {
		$viteManifest = $this->getViteManifest();

		$this->response->setType('text/html');
		return $this->view_factory->render(
			$this->config->get('inertia::inertia.html_template', 'inertia::default'),
			[
				'page' => $pagePlaceholder,
				'title' => $this->config->get('inertia::inertia.title', 'Loading...'),
				'tags' => $viteManifest->createTags('app/resources/js/app.js'),
			]
		);
	}
}