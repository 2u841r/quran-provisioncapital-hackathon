import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user) redirect(302, '/login?next=/profile');

	const row = await db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			image: user.image
		})
		.from(user)
		.where(eq(user.id, locals.user.id))
		.then((r) => r[0]);

	return { user: row };
};

export const actions = {
	updateProfile: async (event: RequestEvent) => {
		if (!event.locals.user) redirect(302, '/login?next=/profile');
		const formData = await event.request.formData();
		const firstName = formData.get('firstName')?.toString().trim() ?? '';
		const lastName = formData.get('lastName')?.toString().trim() ?? '';
		const username = formData.get('username')?.toString().trim() || null;

		if (!firstName) return fail(400, { updateError: 'First name is required.' });
		if (!lastName) return fail(400, { updateError: 'Last name is required.' });

		try {
			await db
				.update(user)
				.set({
					firstName,
					lastName,
					username,
					name: [firstName, lastName].join(' ')
				})
				.where(eq(user.id, event.locals.user.id));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(400, { updateError: 'Username already taken.' });
			}
			return fail(500, { updateError: 'Failed to save changes.' });
		}

		return { updateSuccess: true };
	},

	changePassword: async (event: RequestEvent) => {
		if (!event.locals.user) redirect(302, '/login?next=/profile');
		const formData = await event.request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!currentPassword) return fail(400, { passwordError: 'Current password is required.' });
		if (newPassword.length < 8) return fail(400, { passwordError: 'New password must be at least 8 characters.' });
		if (newPassword !== confirmPassword) return fail(400, { passwordError: 'Passwords do not match.' });

		try {
			await auth.api.changePassword({
				headers: event.request.headers,
				body: { currentPassword, newPassword, revokeOtherSessions: false }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { passwordError: error.message || 'Incorrect current password.' });
			}
			return fail(500, { passwordError: 'Failed to update password.' });
		}

		return { passwordSuccess: true };
	},

	deleteAccount: async (event: RequestEvent) => {
		if (!event.locals.user) redirect(302, '/login');
		const formData = await event.request.formData();
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.deleteUser({
				headers: event.request.headers,
				body: { password }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { deleteError: error.message || 'Incorrect password.' });
			}
			return fail(500, { deleteError: 'Failed to delete account.' });
		}

		redirect(302, '/');
	}
};
