import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingHistory } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

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

	const { verseKey } = await request.json();
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

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
