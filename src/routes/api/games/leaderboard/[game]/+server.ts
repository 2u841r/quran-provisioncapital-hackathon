import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameScores } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const game = params.game ?? '';
	if (!['which-surah', 'prev-next'].includes(game)) error(400, 'Invalid game');

	const rows = await db
		.select({
			playerName: gameScores.playerName,
			score: gameScores.score,
			juzStart: gameScores.juzStart,
			juzEnd: gameScores.juzEnd,
			createdAt: gameScores.createdAt
		})
		.from(gameScores)
		.where(eq(gameScores.gameId, game))
		.orderBy(desc(gameScores.score), desc(gameScores.createdAt))
		.limit(10);

	return json(rows);
};
