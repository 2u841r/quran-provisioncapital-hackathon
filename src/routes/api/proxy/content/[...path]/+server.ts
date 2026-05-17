import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const QF_API_BASE = 'https://api.quran.com/api/v4';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<{ token: string; clientId: string } | null> {
	const { QF_CLIENT_ID, QF_CLIENT_SECRET, QF_OAUTH_URL } = env;
	if (!QF_CLIENT_ID || !QF_CLIENT_SECRET || !QF_OAUTH_URL) return null;

	if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
		return { token: cachedToken, clientId: QF_CLIENT_ID };
	}

	const credentials = btoa(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`);
	try {
		const res = await fetch(`${QF_OAUTH_URL}/oauth2/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`
			},
			body: 'grant_type=client_credentials&scope=content post.read'
		});
		if (!res.ok) return null;
		const data = await res.json() as { access_token?: string };
		cachedToken = data.access_token ?? null;
		tokenExpiresAt = Date.now() + 3500 * 1000;
		return cachedToken ? { token: cachedToken, clientId: QF_CLIENT_ID } : null;
	} catch {
		return null;
	}
}

function resolveTarget(path: string): string {
	const gateway = env.API_GATEWAY_URL || 'https://apis.quran.foundation';
	if (path.startsWith('quran-reflect/')) {
		return `${gateway}/${path}`;
	}
	if (path.startsWith('gateway/')) {
		return `${gateway}/content/api/qdc/${path.slice('gateway/'.length)}`;
	}
	if (path.startsWith('auth/')) {
		return `${gateway}/${path}`;
	}
	return `${QF_API_BASE}/${path}`;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const path = params.path ?? '';
	const target = `${resolveTarget(path)}${url.search}`;
	const isGateway = path.startsWith('gateway/') || path.startsWith('quran-reflect/') || path.startsWith('auth/');

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const auth = await getToken();
	if (auth) {
		if (isGateway) {
			headers['x-auth-token'] = auth.token;
			headers['x-client-id'] = auth.clientId;
		} else {
			headers['Authorization'] = `Bearer ${auth.token}`;
		}
	}

	const res = await fetch(target, { headers });
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
