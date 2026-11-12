import { redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import type { RequestEvent } from '@sveltejs/kit';

import {
	generatePkce,
	randomToken,
	buildAuthorizeUrl,
	QF_USER_CLIENT_ID,
	QF_USER_OAUTH_URL
} from '#lib/server/qf-oauth.ts';

import { ORIGIN } from '$app/env/private';

export const GET = async ({ url, cookies }: RequestEvent) => {
	if (!QF_USER_CLIENT_ID) redirect(302, '/login?error=qf_not_configured');

	const { verifier, challenge } = await generatePkce();
	const state = randomToken();
	const nonce = randomToken(24);
	const next = url.searchParams.get('next') ?? '/';

	cookies.set('qf_oauth', JSON.stringify({ verifier, state, nonce, next }), {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: 600,
	});

	const origin = (ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');

	redirect(302, buildAuthorizeUrl({
		state,
		nonce,
		challenge,
		redirectUri: `${origin}/auth/callback`
	}), { external: [new URL(QF_USER_OAUTH_URL).origin] });
};
