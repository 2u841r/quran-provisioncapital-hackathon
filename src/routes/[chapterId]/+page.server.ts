import { error } from '@sveltejs/kit';
import {
	fetchChapter,
	fetchChapterVerses,
	fetchAvailableTranslations,
	fetchReciters,
	fetchAvailableTafsirs,
	isValidChapterId
} from '$lib/api/quran';
import type { QuranFont } from '$lib/state/reader.svelte';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const { chapterId } = params;

	if (!isValidChapterId(chapterId)) {
		error(404, 'Chapter not found');
	}

	const PER_PAGE = 50;
	const startingVerse = Number(url.searchParams.get('startingVerse') ?? '0') || 0;
	const pageFromQuery = Number(url.searchParams.get('page') ?? '0') || 0;
	const page = pageFromQuery > 0
		? pageFromQuery
		: startingVerse > 0
			? Math.ceil(startingVerse / PER_PAGE)
			: 1;
	const font = (url.searchParams.get('font') as QuranFont) ?? 'text_indopak';
	const mushafLines = (Number(url.searchParams.get('lines') ?? '15') === 16 ? 16 : 15) as 15 | 16;
	const translationsParam = url.searchParams.get('translations');
	const translations = translationsParam ? translationsParam.split(',').map(Number) : [131];

	const [chapter, versesResponse, availableTranslations, reciters, tafsirs] = await Promise.all([
		fetchChapter(fetch, chapterId),
		fetchChapterVerses(fetch, chapterId, font, translations, false, page, PER_PAGE, mushafLines),
		fetchAvailableTranslations(fetch),
		fetchReciters(fetch),
		fetchAvailableTafsirs(fetch)
	]);

	return { chapter, versesResponse, page, startingVerse, availableTranslations, reciters, tafsirs };
};
