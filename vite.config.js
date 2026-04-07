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
	const enablePwaDevServiceWorker = env.VITE_PWA_DEV_SW === 'true';

	const manifestIcons = [
		{
			src: '/favicon-64x64.png',
			sizes: '64x64',
			type: 'image/png'
		},
		{
			src: '/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png'
		},
		{
			src: '/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		},
		/* {
			src: '/maskable-icon-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable'
		} */
	];

	const publicIcons = [
		'/favicon.ico',
		//'/favicon.svg',
		'/apple-touch-icon.png'
	];

	const additionalImages = [];

	return {
		base: '/', // resolve fonts at build time correctly regardless of laravel's config
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
				strategies: 'injectManifest',
				srcDir: 'app/resources/js',
				filename: 'service-worker.js',
				outDir: 'public', // output the injected SW to public/ so it matches the /service-worker.js registration URL
				injectRegister: false, // we'll register the service worker manually in our app.js
				injectManifest: {
					globPatterns: ['**/*.{js,css,html,ico,jpg,png,svg,woff,woff2,ttf,eot}'],
					globIgnores: ['service-worker.js'], // prevent the SW from precaching itself
					maximumFileSizeToCacheInBytes: 5000000,
				},
				//buildBase: '/',
				scope: '/',
				base: '/',
				registerType: 'prompt',
				devOptions: {
					enabled: enablePwaDevServiceWorker,
					type: 'module',
				},
				includeAssets: [
					...publicIcons,
					...additionalImages,
				],
				pwaAssets: {
					disabled: true,
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
			outDir: 'public',
			assetsDir: 'build',
			emptyOutDir: false, // don't delete the entire public/ directory on build
		},
		css: {
			preprocessorOptions: {
				scss: {
					// ignore warnings from Bootstrap
					silenceDeprecations: [
						'import',
						//'mixed-decls',
						'color-functions',
						'global-builtin',
						'if-function',
					],
				},
			},
		},
		// custom networking settings to allow working with domains, docker, and https
		server: {
			host: true,
			port: 5173,
			https: false,
			hmr: {
				host: viteDomain,
				port: 5173,
				protocol: 'wss',
			},
			cors: {
				origin: [
					`https://${viteDomain}:443`,
					`https://${viteDomain}`,
				],
			},
		},
	};
});