import { createApp, h, watch } from 'vue'
import { createInertiaApp, router, usePage } from '@inertiajs/vue3'
import Default from '@/Layouts/Default.vue'
import 'vue-color/style.css';
import '../scss/styles.scss'
import { usePwa } from './composables/usePwa';

// PWA setup
const { createPwa } = usePwa();
createPwa();

function postServiceWorkerMessage(type) {
	if (!navigator.serviceWorker.controller) {
		return false;
	}

	navigator.serviceWorker.controller.postMessage({ type });
	return true;
}

// TODO: make sure this fires as expected, possibly move it to SW?
// Mark Inertia 409 reloads so PWA update UX can skip the refresh notification.
router.on('invalid', (event) => {
	const status = event?.detail?.response?.status;
	if (status === 409) {
		window.__INERTIA_FORCED_RELOAD__ = true;
		postServiceWorkerMessage('RESET_AND_PREWARM');
	}

	if (status === 401 || status === 403) {
		postServiceWorkerMessage('CLEAR_OFFLINE');
	}
});

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
				console.log('User logged in; rebuilding offline cache');
				postServiceWorkerMessage('RESET_AND_PREWARM');
			}

			// logging out
			if (!newStatus && oldStatus) {
				console.log('User logged out; clearing offline cache');
				postServiceWorkerMessage('CLEAR_OFFLINE');
			}
		});
	},
});