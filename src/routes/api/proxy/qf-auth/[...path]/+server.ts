import type { RequestHandler } from '@sveltejs/kit';
import { QF_USER_API_URL, QF_USER_CLIENT_ID } from '$lib/server/qf-oauth';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const path = params.path ?? '';
	const target = `${QF_USER_API_URL}/auth/${path}${url.search}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (locals.qfAccessToken) {
		headers['x-auth-token'] = locals.qfAccessToken;
		headers['x-client-id'] = QF_USER_CLIENT_ID;
	}

	const res = await fetch(target, { headers });
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
