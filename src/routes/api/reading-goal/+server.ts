import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingGoal } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ locals }: RequestEvent) => {
	if (!locals.user) return error(401, 'Unauthorized');
	const [goal] = await db
		.select()
		.from(readingGoal)
		.where(eq(readingGoal.userId, locals.user.id))
		.limit(1);
	return json(goal ?? null);
};

export const POST = async ({ locals, request }: RequestEvent) => {
	if (!locals.user) return error(401, 'Unauthorized');

	const body = await request.json() as {
		type: string;
		period?: string;
		dailyPages?: number;
		dailySeconds?: number;
		duration?: number;
		rangeStart?: string;
		rangeEnd?: string;
	};

	const { type, period = 'daily', dailyPages, dailySeconds, duration, rangeStart, rangeEnd } = body;

	if (!['time', 'pages', 'range'].includes(type)) return error(400, 'Invalid goal type');
	if (!['daily', 'continuous'].includes(period)) return error(400, 'Invalid period');
	if (type === 'range' && (!rangeStart || !rangeEnd)) return error(400, 'rangeStart and rangeEnd required');

	const values = {
		type,
		period,
		dailyPages: type === 'pages' ? (dailyPages ?? null) : null,
		dailySeconds: type === 'time' ? (dailySeconds ?? null) : null,
		duration: period === 'continuous' ? (duration ?? null) : null,
		rangeStart: type === 'range' ? rangeStart! : null,
		rangeEnd: type === 'range' ? rangeEnd! : null,
		updatedAt: new Date()
	};

	const [goal] = await db
		.insert(readingGoal)
		.values({ id: crypto.randomUUID(), userId: locals.user.id, ...values })
		.onConflictDoUpdate({ target: readingGoal.userId, set: values })
		.returning();

	return json(goal, { status: 201 });
};

export const DELETE = async ({ locals }: RequestEvent) => {
	if (!locals.user) return error(401, 'Unauthorized');
	await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));
	return new Response(null, { status: 204 });
};
