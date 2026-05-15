import type { RequestHandler } from '@sveltejs/kit';

const QDC_API_BASE = 'https://api.qurancdn.com/api/qdc';

export const GET: RequestHandler = async ({ params, url }) => {
	const path = params.path ?? '';
	const target = `${QDC_API_BASE}/${path}${url.search}`;

	const res = await fetch(target, {
		headers: { 'Content-Type': 'application/json' }
	});
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
