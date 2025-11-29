import { createApp, h } from 'vue'
import { createInertiaApp, router } from '@inertiajs/vue3'
import Default from '@/Layouts/Default.vue'
import 'vue-color/style.css';
import '../scss/styles.scss'
import { getPage, REFRESH_INTERVAL, startRefreshCycle } from './offline/inertia-offline';

createInertiaApp({
	resolve: (name) => {
		const pages = import.meta.glob('../views/Pages/**/*.vue', { eager: true });
		let page = pages[`../views/Pages/${name}.vue`];
		if (page.default.layout === undefined) {
			page.default.layout = Default;
		}
		return page;
	},
	setup({ el, App, props, plugin }) {
		createApp({ render: () => h(App, props) })
			.use(plugin)
			.mount(el);

		// start refresher
		startRefreshCycle().then(stop => {
			// you can keep stop reference to clear on logout
			window.__OFFLINE_REFRESH_STOP = stop;
		});

		// register service worker & periodic sync
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').then(async reg => {
				console.log('Service worker registered');

				// try to register periodic sync (chrome / android pwa)
				if ('periodicSync' in reg) {
					try {
						await reg.periodicSync.register('inertia-refresh', REFRESH_INTERVAL);
						console.log('Periodic sync registered');
					} catch (err) {
						console.warn('Periodic sync register failed', err);
					}
				}
			}).catch(err => console.warn('Service worker register failed', err));
		}

		// inertia error handler to serve cached pages when offline
		router.on('exception', async (event) => {
			// try to get page from cache
			const rawUrl = event.detail.exception.config.url;
			const url = rawUrl.startsWith(location.origin) ? rawUrl.slice(location.origin.length) : rawUrl;
			const cached = await getPage(url);

			// check if page exists
			if (cached) {
				event.preventDefault();
				router.push({
					url: cached.url,
					component: cached.component || router.page.component,
					props: {
						...cached.props,

						// inject offline indicators
						_offline: true,
						_savedAt: cached.savedAt,
					},
					version: cached.version,
				});
			}
		});
	},
});