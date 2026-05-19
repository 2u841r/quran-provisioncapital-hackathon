import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookmark } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { qfApiFetchAll, qfApiPost, qfApiDelete, MUSHAF_ID } from '$lib/server/qf-oauth';

interface QfBookmark {
	id: string;
	key: number;
	type: string;
	verseNumber?: number;
	createdAt?: string;
}

function verseKeyToQf(verseKey: string) {
	const [surah, ayah] = verseKey.split(':').map(Number);
	return { mushafId: MUSHAF_ID, key: surah, type: 'ayah', verseNumber: ayah };
}

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	if (locals.qfAccessToken) {
		const qfRows = await qfApiFetchAll<QfBookmark>('bookmarks', locals.qfAccessToken, {
			mushafId: MUSHAF_ID
		}).catch(() => [] as QfBookmark[]);

		const rows = qfRows
			.filter((b) => b.type === 'ayah' && b.verseNumber != null)
			.map((b) => ({
				id: b.id,
				userId: locals.user!.id,
				verseKey: `${b.key}:${b.verseNumber}`,
				collectionName: 'Favorites',
				createdAt: b.createdAt ? new Date(b.createdAt) : new Date()
			}));

		return json(rows);
	}

	const rows = await db
		.select()
		.from(bookmark)
		.where(eq(bookmark.userId, locals.user.id))
		.orderBy(bookmark.createdAt);

	return json(rows);
};

export const POST = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json() as { verseKey?: string; collectionName?: string };
	const { verseKey, collectionName = 'Favorites' } = body;
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

	if (locals.qfAccessToken) {
		const res = await qfApiPost<{ success: boolean; data: QfBookmark }>(
			'bookmarks',
			locals.qfAccessToken,
			verseKeyToQf(verseKey)
		).catch(() => null);

		const qfRow = res?.data ?? null;
		if (!qfRow) return json({ exists: true });
		return json({
			id: qfRow.id,
			userId: locals.user.id,
			verseKey,
			collectionName,
			createdAt: qfRow.createdAt ? new Date(qfRow.createdAt) : new Date()
		});
	}

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

	const body = await request.json() as { verseKey?: string; collectionName?: string };
	const { verseKey, collectionName = 'Favorites' } = body;
	if (!verseKey) return json({ error: 'verseKey required' }, { status: 400 });

	if (locals.qfAccessToken) {
		// Fetch all bookmarks and find matching one by key+verseNumber
		const [surah, ayah] = verseKey.split(':').map(Number);
		const all = await qfApiFetchAll<QfBookmark>('bookmarks', locals.qfAccessToken, {
			mushafId: MUSHAF_ID
		}).catch(() => [] as QfBookmark[]);

		const match = all.find((b) => b.key === surah && b.verseNumber === ayah);
		if (match?.id) {
			await qfApiDelete(`bookmarks/${match.id}`, locals.qfAccessToken).catch(() => {});
		}
		return json({ ok: true });
	}

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
