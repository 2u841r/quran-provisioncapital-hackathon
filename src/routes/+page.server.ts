import { getChaptersData } from '$lib/api/quran';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const chapters = getChaptersData();
	return { chapters };
};
