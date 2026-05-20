import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameScores } from '$lib/server/db/schema';
import { validateGuestName } from '$lib/games/data';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json() as {
		game_id: string;
		player_name: string;
		score: number;
		juz_start: number;
		juz_end: number;
	};

	const { game_id, player_name, score, juz_start, juz_end } = body;

	if (!['which-surah', 'prev-next'].includes(game_id)) error(400, 'Invalid game');
	if (typeof score !== 'number' || score < 0 || score > 10) error(400, 'Invalid score');
	if (typeof juz_start !== 'number' || typeof juz_end !== 'number') error(400, 'Invalid juz range');
	if (juz_start < 1 || juz_end > 30 || juz_start > juz_end) error(400, 'Invalid juz range');

	const name = locals.user?.name ?? player_name?.trim();
	if (!name) error(400, 'Player name required');

	if (!locals.user) {
		const err = validateGuestName(name);
		if (err) error(400, err);
	}

	await db.insert(gameScores).values({
		id: crypto.randomUUID(),
		gameId: game_id,
		playerName: name,
		userId: locals.user?.id ?? null,
		score,
		juzStart: juz_start,
		juzEnd: juz_end
	});

	return json({ ok: true });
};
