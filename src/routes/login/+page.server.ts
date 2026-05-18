import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load = ({ locals, url }: RequestEvent) => {
	if (locals.user) redirect(302, url.searchParams.get('next') ?? '/');
	return {};
};

export const actions = {
	signIn: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const next = formData.get('next')?.toString() ?? '/';

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Invalid email or password' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		redirect(302, next);
	},

	signUp: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const next = formData.get('next')?.toString() ?? '/';

		try {
			await auth.api.signUpEmail({ body: { email, password, name } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		redirect(302, next);
	}
};
