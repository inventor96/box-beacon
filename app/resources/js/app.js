import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import Default from '@/Layouts/Default.vue'
import 'vue-color/style.css';
import '../scss/styles.scss'
import { startPreloadCycle } from './offline/preloader';
import './offline/inertia-offline';

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

		// Start preloader when online and user authenticated
		if (navigator.onLine) {
			startPreloadCycle({ intervalMs: 5*60*1000 }).then(stop => {
				// you can keep stop reference to clear on logout
				window.__OFFLINE_PRELOAD_STOP = stop;
			});
		}

		// Register service worker & periodic sync
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').then(async reg => {
				console.log('SW registered');

				// Try to register periodic sync (Chrome Android + installed PWA)
				if ('periodicSync' in reg) {
					try {
						await reg.periodicSync.register('inertia-refresh', { minInterval: 5*60*1000 });
						console.log('Periodic sync registered');
					} catch (err) {
						console.warn('periodicSync register failed', err);
					}
				}
			}).catch(err => console.warn('SW register failed', err));
		}
	},
});