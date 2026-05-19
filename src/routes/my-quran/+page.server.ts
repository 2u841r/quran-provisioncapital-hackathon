import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookmark, readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { qfApiFetchAll, MUSHAF_ID } from '$lib/server/qf-oauth';

interface QfNote {
	id: string;
	body: string;
	ranges?: string[];
	createdAt: string;
	updatedAt: string;
}

interface QfBookmark {
	id: string;
	key: number;
	type: string;
	verseNumber?: number;
	createdAt?: string;
}

interface QfActivityDay {
	id: string;
	date: string;
	ranges: string[];
	pagesRead: number;
	versesRead: number;
	secondsRead: number;
	mushafId: number;
}

function qfBookmarksToLocal(qfBookmarks: QfBookmark[]) {
	return qfBookmarks
		.filter((b) => b.type === 'ayah' && b.verseNumber != null)
		.map((b) => ({
			id: b.id,
			userId: '',
			verseKey: `${b.key}:${b.verseNumber}`,
			collectionName: 'Favorites',
			createdAt: b.createdAt ? new Date(b.createdAt) : new Date()
		}));
}

function qfActivityDaysToHistory(days: QfActivityDay[]) {
	const rows: { verseKey: string; readAt: Date }[] = [];
	for (const day of days) {
		const readAt = new Date(day.date);
		for (const range of day.ranges) {
			const [start, end] = range.split('-');
			if (!start) continue;
			const [startSurah, startAyah] = start.split(':').map(Number);
			if (end) {
				const [endSurah, endAyah] = end.split(':').map(Number);
				if (startSurah === endSurah) {
					for (let a = startAyah; a <= endAyah; a++) {
						rows.push({ verseKey: `${startSurah}:${a}`, readAt });
					}
				} else {
					rows.push({ verseKey: `${startSurah}:${startAyah}`, readAt });
				}
			} else {
				rows.push({ verseKey: `${startSurah}:${startAyah}`, readAt });
			}
		}
	}
	return rows;
}

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

	if (locals.qfAccessToken) {
		const token = locals.qfAccessToken;
		const today = new Date();
		const sixtyDaysAgo = new Date(today);
		sixtyDaysAgo.setDate(today.getDate() - 60);
		const fmt = (d: Date) => d.toISOString().split('T')[0];

		const [qfBookmarks, activityDays, notes] = await Promise.all([
			qfApiFetchAll<QfBookmark>('bookmarks', token, { mushafId: MUSHAF_ID }).catch(() => [] as QfBookmark[]),
			qfApiFetchAll<QfActivityDay>('activity-days', token).catch(() => [] as QfActivityDay[]),
			qfApiFetchAll<QfNote>('notes', token, {}, 'limit-cursor').catch(() => [] as QfNote[])
		]);

		const bookmarks = qfBookmarksToLocal(qfBookmarks);
		const rawHistory = qfActivityDaysToHistory(activityDays);

		return { bookmarks, history: groupHistory(rawHistory), notes, isQfData: true };
	}

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

	return { bookmarks, history: groupHistory(rawHistory), notes: [] as QfNote[], isQfData: false };
};
