import { fetchReciters } from '#lib/api/quran.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const reciters = await fetchReciters(fetch);

	return { reciters: reciters.slice(0, 20) };
};
