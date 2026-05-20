import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateWhichSurahQuestions, generatePrevNextQuestions } from '$lib/server/games';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json() as {
		game: string;
		juz_start: number;
		juz_end: number;
		mode?: 'prev' | 'next';
	};

	const { game, juz_start, juz_end, mode } = body;

	if (!game || typeof juz_start !== 'number' || typeof juz_end !== 'number') {
		error(400, 'Missing required fields');
	}
	if (juz_start < 1 || juz_end > 30 || juz_start > juz_end) {
		error(400, 'Invalid juz range');
	}

	try {
		if (game === 'which-surah') {
			const questions = await generateWhichSurahQuestions(juz_start, juz_end);
			return json({ questions });
		}
		if (game === 'prev-next') {
			if (mode !== 'prev' && mode !== 'next') error(400, 'mode must be prev or next');
			const questions = await generatePrevNextQuestions(juz_start, juz_end, mode);
			return json({ questions });
		}
		error(400, 'Unknown game');
	} catch (e) {
		console.error('[games/questions]', e);
		error(500, 'Failed to generate questions');
	}
};
