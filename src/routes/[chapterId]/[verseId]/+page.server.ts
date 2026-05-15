import { error } from '@sveltejs/kit';
import {
	fetchChapter,
	fetchVerse,
	fetchVerseRange,
	fetchAvailableTranslations,
	fetchReciters,
	fetchAvailableTafsirs,
	isValidChapterId,
	isValidVerseNumber,
	isValidVerseRange
} from '$lib/api/quran';
import type { QuranFont } from '$lib/state/reader.svelte';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const { chapterId, verseId } = params;

	if (!isValidChapterId(chapterId)) {
		error(404, 'Chapter not found');
	}

	const isSingleVerse = isValidVerseNumber(verseId);
	const isRange = isValidVerseRange(verseId);

	if (!isSingleVerse && !isRange) {
		error(404, 'Invalid verse');
	}

	const font = (url.searchParams.get('font') as QuranFont) ?? 'text_indopak';
	const translationsParam = url.searchParams.get('translations');
	const translations = translationsParam ? translationsParam.split(',').map(Number) : [131];

	const chapter = await fetchChapter(fetch, chapterId);

	const [availableTranslations, reciters, tafsirs] = await Promise.all([
		fetchAvailableTranslations(fetch),
		fetchReciters(fetch),
		fetchAvailableTafsirs(fetch)
	]);

	if (isSingleVerse) {
		const verseNum = Number(verseId);
		if (verseNum > chapter.versesCount) {
			error(404, 'Verse not found');
		}
		const verse = await fetchVerse(fetch, chapterId, verseId, font, translations);
		return { chapter, verses: [verse], verseId, isRange: false, availableTranslations, reciters, tafsirs };
	}

	const [fromStr, toStr] = verseId.split('-');
	const from = Number(fromStr);
	const to = Number(toStr);

	if (from >= to || to > chapter.versesCount) {
		error(404, 'Invalid verse range');
	}

	const response = await fetchVerseRange(fetch, chapterId, from, to, font, translations);
	return { chapter, verses: response.verses, verseId, isRange: true, availableTranslations, reciters, tafsirs };
};
