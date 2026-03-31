import { createApp, h, watch } from 'vue'
import { createInertiaApp, usePage } from '@inertiajs/vue3'
import Default from '@/Layouts/Default.vue'
import 'vue-color/style.css';
import '../scss/styles.scss'
import { usePwa } from './composables/usePwa';

// PWA setup
const { createPwa, postServiceWorkerMessage } = usePwa({ onlineCheckUrl: '/pwa/online-check' });
createPwa();

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
				postServiceWorkerMessage('CLEAR_OFFLINE');
				postServiceWorkerMessage('REFRESH_EXPIRED');
			}

			// logging out
			if (!newStatus && oldStatus) {
				console.log('User logged out; clearing offline cache');
				postServiceWorkerMessage('CLEAR_OFFLINE');
			}
		});
	},
});