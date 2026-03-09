import { createApp, h, watch } from 'vue'
import { createInertiaApp, router, usePage } from '@inertiajs/vue3'
import Default from '@/Layouts/Default.vue'
import 'vue-color/style.css';
import '../scss/styles.scss'
import { clearAllData, getPage, REFRESH_INTERVAL, startRefreshCycle } from './offline/inertia-offline';
import { usePwa } from './composables/usePwa';
import { registerSW } from 'virtual:pwa-register';

// PWA setup - option 1
const { createPwa } = usePwa();
createPwa();

// PWA setup - option 2
/* const updateSW = registerSW({
  immediate: false,

  onNeedRefresh() {
    if (window.__INERTIA_FORCED_RELOAD__) {
      delete window.__INERTIA_FORCED_RELOAD__;
      // Safe auto-update window
      updateSW(true)
    } else {
      showUpdateModal()
    }
  },

  onOfflineReady() {
    console.info('App ready for offline use')
  },
});
function showUpdateModal() {
  // YOU OWN THIS UX
  // When confirmed:
  updateSW(true)
} */

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

		// refresh cache after logging in or out
		const page = usePage();
		watch(() => page.props._authed, async (newStatus, oldStatus) => {
			// logging in
			if (newStatus && !oldStatus) {
				console.log('User logged in; refreshing offline cache');
				if (navigator.serviceWorker.controller) {
					navigator.serviceWorker.controller.postMessage({
						type: 'REFRESH_EXPIRED',
					});
				}
			}

			// logging out
			if (!newStatus && oldStatus) {
				console.log('User logged out; clearing offline cache');
				if (navigator.serviceWorker.controller) {
					navigator.serviceWorker.controller.postMessage({
						type: 'CLEAR_OFFLINE',
					});
				}
			}
		});
	},
});