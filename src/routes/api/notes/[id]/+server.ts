import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { qfApiPatch, qfApiDelete } from '$lib/server/qf-oauth';
import type { QfNote } from '../+server';

export const PATCH = async ({ locals, request, params }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!locals.qfAccessToken) return json({ error: 'QF account required' }, { status: 403 });

	const { body, saveToQR = false } = await request.json() as { body?: string; saveToQR?: boolean };
	if (!body) return json({ error: 'body required' }, { status: 400 });

	const res = await qfApiPatch<{ success: boolean; data: QfNote }>(
		`notes/${params.id}`,
		locals.qfAccessToken,
		{ body, saveToQR }
	);
	return json(res.data ?? res);
};

export const DELETE = async ({ locals, params }: RequestEvent) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!locals.qfAccessToken) return json({ error: 'QF account required' }, { status: 403 });

	await qfApiDelete(`notes/${params.id}`, locals.qfAccessToken);
	return json({ ok: true });
};
