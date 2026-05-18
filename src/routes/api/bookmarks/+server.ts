import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookmark } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rows = await db
		.select()
		.from(bookmark)
		.where(eq(bookmark.userId, locals.user.id))
		.orderBy(bookmark.createdAt);

	return json(rows);
};

export const POST = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { verseKey, collectionName = 'Favorites' } = await request.json();
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

	const id = crypto.randomUUID();
	const [row] = await db
		.insert(bookmark)
		.values({ id, userId: locals.user.id, verseKey, collectionName })
		.onConflictDoNothing()
		.returning();

	return json(row ?? { exists: true });
};

export const DELETE = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { verseKey, collectionName = 'Favorites' } = await request.json();
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

	await db
		.delete(bookmark)
		.where(
			and(
				eq(bookmark.userId, locals.user.id),
				eq(bookmark.verseKey, verseKey),
				eq(bookmark.collectionName, collectionName)
			)
		);

	return json({ ok: true });
};
