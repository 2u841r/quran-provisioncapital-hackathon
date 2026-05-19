import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { qfApiFetchAll, qfApiPost, MUSHAF_ID } from '$lib/server/qf-oauth';

interface QfActivityDay {
	id: string;
	date: string;
	ranges: string[];
	pagesRead: number;
	versesRead: number;
	secondsRead: number;
	mushafId: number;
}

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	if (locals.qfAccessToken) {
		const days = await qfApiFetchAll<QfActivityDay>('activity-days', locals.qfAccessToken).catch(() => [] as QfActivityDay[]);

		const rows: { verseKey: string; readAt: string }[] = [];
		for (const day of days) {
			for (const range of day.ranges) {
				const [start, end] = range.split('-');
				if (!start) continue;
				const [startSurah, startAyah] = start.split(':').map(Number);
				if (end) {
					const [, endAyah] = end.split(':').map(Number);
					for (let a = startAyah; a <= endAyah; a++) {
						rows.push({ verseKey: `${startSurah}:${a}`, readAt: day.date });
					}
				} else {
					rows.push({ verseKey: `${startSurah}:${startAyah}`, readAt: day.date });
				}
			}
		}

		return json(rows.slice(0, 50));
	}

	const rows = await db
		.select()
		.from(readingHistory)
		.where(eq(readingHistory.userId, locals.user.id))
		.orderBy(desc(readingHistory.readAt))
		.limit(50);

	return json(rows);
};

export const POST = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { verseKey } = await request.json() as { verseKey?: string };
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

	if (locals.qfAccessToken) {
		const range = `${verseKey}-${verseKey}`;
		await qfApiPost(
			'activity-days',
			locals.qfAccessToken,
			{ type: 'QURAN', ranges: [range], mushafId: MUSHAF_ID, seconds: 30 }
		).catch(() => {});

		return json({ verseKey, readAt: new Date().toISOString() });
	}

	const id = crypto.randomUUID();
	const [row] = await db
		.insert(readingHistory)
		.values({ id, userId: locals.user.id, verseKey, readAt: new Date() })
		.onConflictDoUpdate({
			target: [readingHistory.userId, readingHistory.verseKey],
			set: { readAt: new Date() }
		})
		.returning();

	return json(row);
};
