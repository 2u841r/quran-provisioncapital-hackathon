import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { account as accountTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { refreshAccessToken } from '$lib/server/qf-oauth';

// Redirect apex domain quran.bid → www.quran.bid (301)
const handleApex: Handle = async ({ event, resolve }) => {
	const host = event.request.headers.get('host') ?? '';
	if (host === 'quran.bid') {
		const url = new URL(event.request.url);
		url.hostname = 'www.quran.bid';
		return Response.redirect(url.toString(), 301);
	}
	return resolve(event);
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		const [qfAccount] = await db
			.select()
			.from(accountTable)
			.where(and(eq(accountTable.userId, session.user.id), eq(accountTable.providerId, 'qf')))
			.limit(1);

		if (qfAccount?.accessToken) {
			const expired =
				qfAccount.accessTokenExpiresAt && qfAccount.accessTokenExpiresAt < new Date();

			if (expired && qfAccount.refreshToken) {
				try {
					const fresh = await refreshAccessToken(qfAccount.refreshToken);
					await db
						.update(accountTable)
						.set({
							accessToken: fresh.access_token,
							refreshToken: fresh.refresh_token,
							idToken: fresh.id_token,
							accessTokenExpiresAt: new Date(Date.now() + fresh.expires_in * 1000),
						})
						.where(eq(accountTable.id, qfAccount.id));
					event.locals.qfAccessToken = fresh.access_token;
				} catch {
					// Token refresh failed - user will need to re-auth via /auth/qf
				}
			} else {
				event.locals.qfAccessToken = qfAccount.accessToken;
			}
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleApex, handleBetterAuth);
