import { error } from '@sveltejs/kit';
import {
	fetchChapter,
	fetchVerse,
	fetchVerseRange,
	isValidChapterId,
	isValidVerseNumber,
	isValidVerseRange
} from '$lib/api/quran';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { chapterId, verseId } = params;

	if (!isValidChapterId(chapterId)) {
		error(404, 'Chapter not found');
	}

	const isSingleVerse = isValidVerseNumber(verseId);
	const isRange = isValidVerseRange(verseId);

	if (!isSingleVerse && !isRange) {
		error(404, 'Invalid verse');
	}

	const chapter = await fetchChapter(fetch, chapterId);

	if (isSingleVerse) {
		const verseNum = Number(verseId);
		if (verseNum > chapter.versesCount) {
			error(404, 'Verse not found');
		}
		const verse = await fetchVerse(fetch, chapterId, verseId);
		return { chapter, verses: [verse], verseId, isRange: false };
	}

	const [fromStr, toStr] = verseId.split('-');
	const from = Number(fromStr);
	const to = Number(toStr);

	if (from >= to || to > chapter.versesCount) {
		error(404, 'Invalid verse range');
	}

	const response = await fetchVerseRange(fetch, chapterId, from, to);
	return { chapter, verses: response.verses, verseId, isRange: true };
};
