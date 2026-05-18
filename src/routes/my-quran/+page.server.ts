import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookmark, readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user) redirect(302, '/login?next=/my-quran');

	const [bookmarks, history] = await Promise.all([
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
			.limit(50)
	]);

	return { bookmarks, history };
};
