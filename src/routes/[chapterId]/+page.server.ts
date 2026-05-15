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

	const page = Number(url.searchParams.get('page') ?? '1');
	const font = (url.searchParams.get('font') as QuranFont) ?? 'text_indopak';
	const translationsParam = url.searchParams.get('translations');
	const translations = translationsParam ? translationsParam.split(',').map(Number) : [131];

	const [chapter, versesResponse, availableTranslations, reciters, tafsirs] = await Promise.all([
		fetchChapter(fetch, chapterId),
		fetchChapterVerses(fetch, chapterId, font, translations, false, page),
		fetchAvailableTranslations(fetch),
		fetchReciters(fetch),
		fetchAvailableTafsirs(fetch)
	]);

	return { chapter, versesResponse, page, availableTranslations, reciters, tafsirs };
};
