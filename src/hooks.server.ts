import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

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
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleApex, handleBetterAuth);
