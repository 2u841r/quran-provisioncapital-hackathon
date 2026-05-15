import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const QF_API_BASE = 'https://api.quran.com/api/v4';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string | null> {
	if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

	const { QF_CLIENT_ID, QF_CLIENT_SECRET, QF_OAUTH_URL } = env;
	if (!QF_CLIENT_ID || !QF_CLIENT_SECRET || !QF_OAUTH_URL) return null;

	const credentials = btoa(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`);
	try {
		const res = await fetch(`${QF_OAUTH_URL}/oauth2/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`
			},
			body: 'grant_type=client_credentials&scope=content'
		});
		if (!res.ok) return null;
		const data = await res.json() as { access_token?: string };
		cachedToken = data.access_token ?? null;
		tokenExpiresAt = Date.now() + 3500 * 1000;
		return cachedToken;
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ params, url }) => {
	const path = params.path ?? '';
	const target = `${QF_API_BASE}/${path}${url.search}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const token = await getToken();
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(target, { headers });
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
