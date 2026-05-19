import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { qfApiFetchAll, qfApiPost } from '$lib/server/qf-oauth';

export interface QfNote {
	id: string;
	body: string;
	ranges?: string[];
	verseKey?: string;
	createdAt: string;
	updatedAt: string;
	saveToQR?: boolean;
}

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!locals.qfAccessToken) return json({ error: 'QF account required' }, { status: 403 });

	const notes = await qfApiFetchAll<QfNote>('notes', locals.qfAccessToken, {}, 'limit-cursor').catch(() => [] as QfNote[]);
	return json(notes);
};

export const POST = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!locals.qfAccessToken) return json({ error: 'QF account required' }, { status: 403 });

	const { body, ranges, verseKey } = await request.json() as {
		body?: string;
		ranges?: string[];
		verseKey?: string;
	};
	if (!body) return json({ error: 'body required' }, { status: 400 });

	const payload: { body: string; ranges?: string[]; saveToQR: boolean } = {
		body,
		saveToQR: false,
		...(ranges?.length ? { ranges } : verseKey ? { ranges: [`${verseKey}-${verseKey}`] } : {})
	};

	const res = await qfApiPost<{ success: boolean; data: QfNote }>(
		'notes',
		locals.qfAccessToken,
		payload
	);
	return json(res.data ?? res);
};
