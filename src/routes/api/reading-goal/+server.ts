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

	const body = await request.json() as { type: string; dailyTarget?: number; rangeStart?: string; rangeEnd?: string };
	const { type, dailyTarget, rangeStart, rangeEnd } = body;

	if (!type || (type !== 'daily_verses' && type !== 'range')) {
		return error(400, 'Invalid goal type');
	}
	if (type === 'daily_verses' && (!dailyTarget || dailyTarget < 1)) {
		return error(400, 'dailyTarget required for daily_verses');
	}
	if (type === 'range' && (!rangeStart || !rangeEnd)) {
		return error(400, 'rangeStart and rangeEnd required for range');
	}

	const [goal] = await db
		.insert(readingGoal)
		.values({
			id: crypto.randomUUID(),
			userId: locals.user.id,
			type,
			dailyTarget: type === 'daily_verses' ? Number(dailyTarget) : null,
			rangeStart: type === 'range' ? rangeStart : null,
			rangeEnd: type === 'range' ? rangeEnd : null
		})
		.onConflictDoUpdate({
			target: readingGoal.userId,
			set: {
				type,
				dailyTarget: type === 'daily_verses' ? Number(dailyTarget) : null,
				rangeStart: type === 'range' ? rangeStart : null,
				rangeEnd: type === 'range' ? rangeEnd : null,
				updatedAt: new Date()
			}
		})
		.returning();

	return json(goal, { status: 201 });
};

export const DELETE = async ({ locals }: RequestEvent) => {
	if (!locals.user) return error(401, 'Unauthorized');

	await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));

	return new Response(null, { status: 204 });
};
