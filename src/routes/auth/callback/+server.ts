import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';
import { exchangeCode, decodeJwt, signForBetterAuth } from '$lib/server/qf-oauth';
import { db } from '$lib/server/db';
import { user as userTable, account as accountTable, session as sessionTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const GET = async ({ url, cookies }: RequestEvent) => {
	const rawCookie = cookies.get('qf_oauth');
	cookies.delete('qf_oauth', { path: '/' });

	const error = url.searchParams.get('error');
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (error) redirect(302, `/login?error=${encodeURIComponent(error)}`);
	if (!code || !rawCookie) redirect(302, '/login?error=missing_params');

	let oauthState: { verifier: string; state: string; nonce: string; next: string };
	try {
		oauthState = JSON.parse(rawCookie) as typeof oauthState;
	} catch {
		redirect(302, '/login?error=invalid_state');
	}

	if (state !== oauthState.state) redirect(302, '/login?error=state_mismatch');

	const origin = (env.ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');
	const redirectUri = `${origin}/auth/callback`;

	let tokens: Awaited<ReturnType<typeof exchangeCode>>;
	try {
		tokens = await exchangeCode(code, oauthState.verifier, redirectUri);
	} catch (e) {
		console.error('[qf-callback] token exchange failed:', e);
		redirect(302, '/login?error=token_exchange_failed');
	}

	const claims = decodeJwt(tokens.id_token);
	if (!claims?.sub) redirect(302, '/login?error=invalid_id_token');

	const sub = String(claims!.sub);
	const email = String(claims!.email ?? `${sub}@users.quran.foundation`);
	const name = String(claims!.name ?? claims!.preferred_username ?? 'Quran.com User');
	const image = claims!.picture ? String(claims!.picture) : null;
	const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

	const [existingAccount] = await db
		.select()
		.from(accountTable)
		.where(and(eq(accountTable.providerId, 'qf'), eq(accountTable.accountId, sub)))
		.limit(1);

	let userId: string;

	if (existingAccount) {
		userId = existingAccount.userId;
		await db
			.update(accountTable)
			.set({
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				idToken: tokens.id_token,
				accessTokenExpiresAt: tokenExpiresAt,
				scope: tokens.scope,
			})
			.where(eq(accountTable.id, existingAccount.id));
	} else {
		await db
			.insert(userTable)
			.values({ id: crypto.randomUUID(), name, email, emailVerified: true, image, updatedAt: new Date() })
			.onConflictDoUpdate({ target: userTable.email, set: { name, image, updatedAt: new Date() } });

		const [u] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
		userId = u.id;

		await db.insert(accountTable).values({
			id: crypto.randomUUID(),
			accountId: sub,
			providerId: 'qf',
			userId,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			idToken: tokens.id_token,
			accessTokenExpiresAt: tokenExpiresAt,
			scope: tokens.scope,
			updatedAt: new Date(),
		});
	}

	const sessionToken = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	await db.insert(sessionTable).values({
		id: crypto.randomUUID(),
		token: sessionToken,
		userId,
		expiresAt,
		updatedAt: new Date(),
	});

	const signedToken = await signForBetterAuth(sessionToken, env.BETTER_AUTH_SECRET ?? '');

	const secure = !dev;
	const cookieName = secure ? '__Secure-better-auth.session_token' : 'better-auth.session_token';
	cookies.set(cookieName, signedToken, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		expires: expiresAt,
	});

	redirect(302, oauthState.next ?? '/');
};
