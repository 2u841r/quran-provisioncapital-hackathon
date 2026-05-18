import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookmark, readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

function groupHistory(rows: { verseKey: string; readAt: Date }[]) {
	// Group by surah, track verse numbers + most recent readAt
	const map = new Map<number, { verses: number[]; readAt: Date }>();

	for (const row of rows) {
		const [s, a] = row.verseKey.split(':');
		const surah = Number(s);
		const ayah = Number(a);
		if (!map.has(surah)) {
			map.set(surah, { verses: [], readAt: row.readAt });
		}
		const entry = map.get(surah)!;
		entry.verses.push(ayah);
		if (row.readAt > entry.readAt) entry.readAt = row.readAt;
	}

	// Build merged ranges per surah (gap tolerance: 5, matching Next.js)
	const result: { surah: number; ranges: [number, number][]; readAt: Date }[] = [];

	for (const [surah, { verses, readAt }] of map) {
		verses.sort((a, b) => a - b);

		const ranges: [number, number][] = [];
		let start = verses[0];
		let end = start;

		for (let i = 1; i < verses.length; i++) {
			if (verses[i] - end <= 5) {
				end = verses[i];
			} else {
				ranges.push([start, end]);
				start = verses[i];
				end = start;
			}
		}
		ranges.push([start, end]);

		result.push({ surah, ranges, readAt });
	}

	return result.sort((a, b) => b.readAt.getTime() - a.readAt.getTime());
}

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user) redirect(302, '/login?next=/my-quran');

	const [bookmarks, rawHistory] = await Promise.all([
		db
			.select()
			.from(bookmark)
			.where(eq(bookmark.userId, locals.user.id))
			.orderBy(desc(bookmark.createdAt)),
		db
			.select()
			.from(readingHistory)
			.where(eq(readingHistory.userId, locals.user.id))
			.orderBy(desc(readingHistory.readAt))
			.limit(200)
	]);

	return { bookmarks, history: groupHistory(rawHistory) };
};
