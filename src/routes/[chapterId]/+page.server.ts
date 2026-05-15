import { error } from '@sveltejs/kit';
import { fetchChapter, fetchChapterVerses, isValidChapterId } from '$lib/api/quran';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const { chapterId } = params;

	if (!isValidChapterId(chapterId)) {
		error(404, 'Chapter not found');
	}

	const page = Number(url.searchParams.get('page') ?? '1');

	const [chapter, versesResponse] = await Promise.all([
		fetchChapter(fetch, chapterId),
		fetchChapterVerses(fetch, chapterId, page)
	]);

	return { chapter, versesResponse, page };
};
