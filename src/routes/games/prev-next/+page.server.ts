import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { gameScores } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	let leaderboard: { playerName: string; score: number; juzStart: number; juzEnd: number; createdAt: Date }[] = [];
	try {
		leaderboard = await db
			.select({
				playerName: gameScores.playerName,
				score: gameScores.score,
				juzStart: gameScores.juzStart,
				juzEnd: gameScores.juzEnd,
				createdAt: gameScores.createdAt
			})
			.from(gameScores)
			.where(eq(gameScores.gameId, 'prev-next'))
			.orderBy(desc(gameScores.score), desc(gameScores.createdAt))
			.limit(10);
	} catch {
		// table may not exist yet
	}
	return { leaderboard, user: locals.user ?? null };
};
