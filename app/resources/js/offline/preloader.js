import db from './db';
import { cacheInertiaUrl } from './offline-cache';
import axios from 'axios';

const CONCURRENCY = 4;
const STAGGER = 100; // ms between requests to reduce burst

// fetch the backend-provided list; store as routeMeta entries
export async function refreshRouteList() {
	try {
		const res = await axios.get('/offline/routes', { withCredentials: true });
		if (!res || res.status !== 200) return;
		const routes = res.data; // [{url, ttl},...]
		// store/overwrite route meta
		const tx = db.transaction('rw', db.routeMeta, async () => {
			await db.routeMeta.clear();
			for (const r of routes) {
				await db.routeMeta.put({ url: r.url, ttl: r.ttl });
			}
		});
		await tx;
		return routes;
	} catch (err) {
		console.warn('refreshRouteList failed', err);
		return [];
	}
}

// Check DB for pages past TTL and refresh them (bounded concurrency)
export async function refreshExpiredPages() {
	const toRefresh = [];
	await db.transaction('r', db.routeMeta, db.pages, async () => {
		const allMeta = await db.routeMeta.toArray();
		for (const m of allMeta) {
			const cached = await db.pages.get(m.url);
			if (!cached) {
				toRefresh.push({ url: m.url, ttl: m.ttl });
			} else if (cached.expiresAt && Date.now() > cached.expiresAt) {
				toRefresh.push({ url: m.url, ttl: m.ttl });
			}
		}
	});

	// bounded concurrency
	const active = [];
	for (const item of toRefresh) {
		const p = (async () => {
			await cacheInertiaUrl(item.url, item.ttl);
			await new Promise(r => setTimeout(r, STAGGER));
		})();
		active.push(p);
		if (active.length >= CONCURRENCY) {
			await Promise.race(active).catch(()=>{});
			// remove settled
			for (let i = active.length - 1; i >= 0; i--) {
				if (active[i].isFulfilled || active[i].isRejected) active.splice(i,1);
			}
		}
	}
	await Promise.all(active);
}

// top-level startup: call this after login or page load when online
export async function startPreloadCycle({ intervalMs = 5*60*1000 } = {}) {
	// run once now
	await refreshRouteList();
	await refreshExpiredPages();

	// then run periodic timer while app stays open (works on all browsers)
	const id = setInterval(async () => {
		if (!navigator.onLine) return;
		// refresh route list occasionally (you might fetch list less often than pages)
		await refreshRouteList();
		await refreshExpiredPages();
	}, intervalMs);

	return () => clearInterval(id); // returns stop function
}