import { router } from '@inertiajs/vue3';
import { getCachedPage } from './offline-cache';

router.on('error', async (event) => {
	// event.detail may be missing on network failures
	const url = event.detail?.url || router.page.url;
	const cached = await getCachedPage(url);
	if (cached && cached.record) {
		// If expired but present, still show cached record (policy: you decided cache never expires)
		const record = cached.record;
		router.setPage({
			component: record.component || router.page.component,
			props: record.props,
			url: record.url,
			version: null
		});
	}
});