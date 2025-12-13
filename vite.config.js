import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
	// get environment variables
	const env = loadEnv(mode, process.cwd(), '');
	const viteDomain = env.VITE_DOMAIN || 'localhost';
	const vitePort = env.VITE_PORT ? Number(env.VITE_PORT) : 5173;
	const backendPort = env.VITE_BACKEND_PORT ? Number(env.VITE_BACKEND_PORT) : 8080;

	const manifestIcons = [
		{
			src: '/pwa-64x64.png',
			sizes: '64x64',
			type: 'image/png'
		},
		{
			src: '/pwa-192x192.png',
			sizes: '192x192',
			type: 'image/png'
		},
		{
			src: '/pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: '/maskable-icon-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable'
		}
	];

	const publicIcons = [
		{ src: '/favicon.ico' },
		{ src: '/favicon.svg' },
		{ src: '/apple-touch-icon-180x180.png' }
	];

	const additionalImages = [];

	return {
		plugins: [
			laravel({
				input: 'app/resources/js/app.js',
				refresh: true,
			}),
			vue({
				template: {
					transformAssetUrls: {
						base: null,
						includeAbsolute: false,
					},
				},
			}),
			VitePWA({
				//buildBase: '/../',
				scope: '/',
				base: '/',
				registerType: 'prompt',
				devOptions: {
					enabled: true,
				},
				includeAssets: [],
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,jpg,png,svg,woff,woff2,ttf,eot}'],
					navigateFallback: '/',
					navigateFallbackDenylist: [],
					additionalManifestEntries: [
						{ url: '/', revision: `${Date.now()}` },
						...manifestIcons.map((icon) => ({ url: icon.src, revision: `${Date.now()}` })),
						...publicIcons.map((icon) => ({ url: icon.src, revision: `${Date.now()}` })),
						...additionalImages.map((img) => ({ url: img.src, revision: `${Date.now()}` })),
					],
					maximumFileSizeToCacheInBytes: 5000000,
				},
				manifest: {
					name: 'Box Beacon',
					short_name: 'Box Beacon',
					description: 'Box Beacon Application',
					theme_color: '#ffffff',
					background_color: '#ffffff',
					orientation: 'portrait',
					display: 'standalone',
					scope: '/',
					start_url: '/',
					id: '/',
					icons: manifestIcons,
				},
			}),
			vueDevTools({
				appendTo: 'app/resources/js/app.js',
			}),
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'app/resources/views'),
			},
		},
		build: {
			outDir: 'public/build',
			assetsDir: 'assets',
		},
		css: {
			preprocessorOptions: {
				scss: {
					// ignore warnings from Bootstrap
					silenceDeprecations: [
						'import',
						'mixed-decls',
						'color-functions',
						'global-builtin',
					],
				},
			},
		},
		// custom networking settings to allow working with domains and docker
		server: {
			port: vitePort,
			hmr: {
				host: viteDomain,
				port: vitePort,
			},
			cors: {
				origin: [
					`http://${viteDomain}:${backendPort}`,
					`http://${viteDomain}`,
				],
			},
		},
	};
});