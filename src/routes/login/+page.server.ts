import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const load = ({ locals, url }: RequestEvent) => {
	if (locals.user) redirect(302, url.searchParams.get('next') ?? '/');
	return {};
};
