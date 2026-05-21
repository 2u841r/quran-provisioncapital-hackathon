import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { qfApiFetchAll, QF_USER_API_URL, QF_USER_CLIENT_ID } from '$lib/server/qf-oauth';
import type { PageServerLoad } from './$types';

interface QfActivityDay {
	id: string;
	date: string;
	ranges: string[];
	pagesRead: number;
	versesRead: number;
	secondsRead: number;
}

interface HistoryEntry {
	verseKey: string;
	readAt: string;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login?next=/reading-history');

	let entries: HistoryEntry[] = [];

	if (locals.qfAccessToken) {
		const days = await qfApiFetchAll<QfActivityDay>('activity-days', locals.qfAccessToken).catch(() => [] as QfActivityDay[]);
		for (const day of days) {
			for (const range of day.ranges) {
				const [start] = range.split('-');
				if (start) entries.push({ verseKey: start, readAt: day.date });
			}
		}
		entries = entries.slice(0, 100);
	} else {
		const rows = await db
			.select()
			.from(readingHistory)
			.where(eq(readingHistory.userId, locals.user.id))
			.orderBy(desc(readingHistory.readAt))
			.limit(100);
		entries = rows.map((r) => ({ verseKey: r.verseKey, readAt: r.readAt.toISOString() }));
	}

	// Group by date (YYYY-MM-DD)
	const byDate = new Map<string, string[]>();
	for (const { verseKey, readAt } of entries) {
		const date = readAt.slice(0, 10);
		if (!byDate.has(date)) byDate.set(date, []);
		if (!byDate.get(date)!.includes(verseKey)) byDate.get(date)!.push(verseKey);
	}

	const grouped = [...byDate.entries()]
		.sort((a, b) => b[0].localeCompare(a[0]))
		.map(([date, verseKeys]) => ({ date, verseKeys }));

	return { grouped };
};
