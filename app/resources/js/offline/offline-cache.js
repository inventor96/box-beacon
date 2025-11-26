import db from './db';
import axios from 'axios';

// Fetch an inertia JSON url and store it in Dexie
export async function cacheInertiaUrl(url, ttlSeconds) {
	try {
		const res = await axios.get(url, { headers: {'X-Inertia': 'true', 'Accept': 'application/json'} , withCredentials: true });
		if (res.status !== 200 || !res.data) return false;
		const payload = {
			url,
			component: res.data.component ?? null,
			props: res.data.props ?? null,
			savedAt: Date.now(),
			expiresAt: ttlSeconds ? Date.now() + ttlSeconds*1000 : null
		};
		await db.pages.put(payload);
		return true;
	} catch (err) {
		// network failure -> ignore
		return false;
	}
}

// Get cached page if present and not expired
export async function getCachedPage(url) {
	const p = await db.pages.get(url);
	if (!p) return null;
	if (p.expiresAt && Date.now() > p.expiresAt) return { expired: true, record: p };
	return { expired: false, record: p };
}

// Remove all caches on logout
export async function clearCaches() {
	await db.pages.clear();
	await db.routeMeta.clear();
}