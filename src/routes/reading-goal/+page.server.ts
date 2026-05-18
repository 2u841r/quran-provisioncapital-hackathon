import { redirect, fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingGoal, readingHistory } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';

function startOfDay(date: Date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfWeek(date: Date) {
	const d = new Date(date);
	d.setDate(d.getDate() - d.getDay()); // Sunday
	d.setHours(0, 0, 0, 0);
	return d;
}

function calcStreak(readDates: Date[], today: Date): number {
	if (readDates.length === 0) return 0;

	const todayStr = startOfDay(today).getTime();
	const uniqueDays = [
		...new Set(readDates.map((d) => startOfDay(d).getTime()))
	].sort((a, b) => b - a);

	// streak requires read today or yesterday to be ongoing
	if (uniqueDays[0] < todayStr - 86400000) return 0;

	let streak = 0;
	let expected = uniqueDays[0] === todayStr ? todayStr : todayStr - 86400000;

	for (const day of uniqueDays) {
		if (day === expected) {
			streak++;
			expected -= 86400000;
		} else if (day < expected) {
			break;
		}
	}

	return streak;
}

function buildWeekData(readDates: Date[], today: Date) {
	const weekStart = startOfWeek(today);
	const days = [];

	for (let i = 0; i < 7; i++) {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		days.push({
			date: d.toISOString(),
			dayName: d.toLocaleDateString('en', { weekday: 'short' }),
			dayNum: d.getDate(),
			isToday: startOfDay(d).getTime() === startOfDay(today).getTime(),
			isFuture: d > today,
			hasRead: false
		});
	}

	const readSet = new Set(readDates.map((d) => startOfDay(d).getTime()));
	for (const day of days) {
		const t = startOfDay(new Date(day.date)).getTime();
		if (readSet.has(t)) day.hasRead = true;
	}

	return days;
}

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user) redirect(302, '/login?next=/reading-goal');

	const today = new Date();
	const todayStart = startOfDay(today);

	const [goal] = await db
		.select()
		.from(readingGoal)
		.where(eq(readingGoal.userId, locals.user.id))
		.limit(1);

	if (!goal) {
		return { goal: null, streak: 0, weekData: [], todayCount: 0, totalVerses: 6236 };
	}

	// Get recent history for streak + week
	const sixtyDaysAgo = new Date(today);
	sixtyDaysAgo.setDate(today.getDate() - 60);

	const history = await db
		.select({ readAt: readingHistory.readAt })
		.from(readingHistory)
		.where(
			and(
				eq(readingHistory.userId, locals.user.id),
				gte(readingHistory.readAt, sixtyDaysAgo)
			)
		);

	const readDates = history.map((h) => h.readAt);
	const streak = calcStreak(readDates, today);
	const weekData = buildWeekData(readDates, today);

	// Today's verse count
	const todayHistory = await db
		.select({ verseKey: readingHistory.verseKey })
		.from(readingHistory)
		.where(
			and(
				eq(readingHistory.userId, locals.user.id),
				gte(readingHistory.readAt, todayStart)
			)
		);
	const todayCount = todayHistory.length;

	// For range goals, compute progress
	let rangeProgress: { total: number; done: number; percent: number } | null = null;
	if (goal.type === 'range' && goal.rangeStart && goal.rangeEnd) {
		const [startSurah, startAyah] = goal.rangeStart.split(':').map(Number);
		const [endSurah, endAyah] = goal.rangeEnd.split(':').map(Number);

		// Count distinct verses read since goal created that fall in range
		const allHistory = await db
			.select({ verseKey: readingHistory.verseKey })
			.from(readingHistory)
			.where(
				and(
					eq(readingHistory.userId, locals.user.id),
					gte(readingHistory.readAt, goal.createdAt)
				)
			);

		const readInRange = new Set<string>();
		for (const { verseKey } of allHistory) {
			const [s, a] = verseKey.split(':').map(Number);
			const afterStart = s > startSurah || (s === startSurah && a >= startAyah);
			const beforeEnd = s < endSurah || (s === endSurah && a <= endAyah);
			if (afterStart && beforeEnd) readInRange.add(verseKey);
		}

		// Approximate total verses in range (rough: can't know exact without chapter data)
		// We'll compute it properly client-side; send raw counts
		rangeProgress = {
			total: -1, // client fills in
			done: readInRange.size,
			percent: -1
		};
	}

	return {
		goal: {
			...goal,
			createdAt: goal.createdAt.toISOString(),
			updatedAt: goal.updatedAt.toISOString()
		},
		streak,
		weekData,
		todayCount,
		totalVerses: 6236,
		rangeProgress
	};
};

export const actions = {
	save: async ({ locals, request }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const form = await request.formData();
		const type = form.get('type') as string;
		const dailyTarget = form.get('dailyTarget');
		const rangeStart = form.get('rangeStart') as string;
		const rangeEnd = form.get('rangeEnd') as string;

		if (type !== 'daily_verses' && type !== 'range') {
			return fail(400, { error: 'Invalid goal type' });
		}
		if (type === 'daily_verses' && (!dailyTarget || Number(dailyTarget) < 1)) {
			return fail(400, { error: 'Enter a daily verse target' });
		}
		if (type === 'range' && (!rangeStart || !rangeEnd)) {
			return fail(400, { error: 'Select start and end verses' });
		}

		await db
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
			});

		return { success: true };
	},

	delete: async ({ locals }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));

		return { success: true };
	}
};
