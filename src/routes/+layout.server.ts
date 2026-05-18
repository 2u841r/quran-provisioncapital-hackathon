import type { ServerLoad } from '@sveltejs/kit';
import { fetchReciters } from '$lib/api/quran';

export const load: ServerLoad = async ({ locals, fetch }) => {
	const reciters = await fetchReciters(fetch);
	return { user: locals.user ?? null, reciters };
};
