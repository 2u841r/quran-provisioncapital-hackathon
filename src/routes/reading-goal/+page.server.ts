import { redirect, fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingGoal, readingHistory } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';

// ~10.3 verses per Quran page (604 pages / 6236 verses)
const VERSES_PER_PAGE = 10.3;
// rough seconds per verse when reading aloud or following along
const SECONDS_PER_VERSE = 30;

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
	const todayMs = startOfDay(today).getTime();
	const uniqueDays = [...new Set(readDates.map((d) => startOfDay(d).getTime()))].sort(
		(a, b) => b - a
	);
	if (uniqueDays[0] < todayMs - 86400000) return 0;
	let streak = 0;
	let expected = uniqueDays[0] === todayMs ? todayMs : todayMs - 86400000;
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
			isToday: startOfDay(d).getTime() === startOfDay(today).getTime(),
			isFuture: d > today,
			hasRead: false
		});
	}
	const readSet = new Set(readDates.map((d) => startOfDay(d).getTime()));
	for (const day of days) {
		if (readSet.has(startOfDay(new Date(day.date)).getTime())) day.hasRead = true;
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
		return { goal: null, streak: 0, weekData: [], todayProgress: null };
	}

	const sixtyDaysAgo = new Date(today);
	sixtyDaysAgo.setDate(today.getDate() - 60);

	const [recentHistory, todayHistory] = await Promise.all([
		db
			.select({ readAt: readingHistory.readAt })
			.from(readingHistory)
			.where(
				and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, sixtyDaysAgo))
			),
		db
			.select({ verseKey: readingHistory.verseKey })
			.from(readingHistory)
			.where(
				and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, todayStart))
			)
	]);

	const streak = calcStreak(
		recentHistory.map((h) => h.readAt),
		today
	);
	const weekData = buildWeekData(
		recentHistory.map((h) => h.readAt),
		today
	);

	const todayVerses = todayHistory.length;

	// Compute today's progress depending on goal type
	let todayProgress: {
		type: string;
		done: number;
		target: number;
		unit: string;
		percent: number;
		isComplete: boolean;
	} | null = null;

	if (goal.period === 'daily') {
		if (goal.type === 'pages') {
			const donePages = Math.round((todayVerses / VERSES_PER_PAGE) * 10) / 10;
			const target = goal.dailyPages ?? 1;
			const percent = Math.min(100, Math.round((donePages / target) * 100));
			todayProgress = {
				type: 'pages',
				done: donePages,
				target,
				unit: 'pages',
				percent,
				isComplete: donePages >= target
			};
		} else if (goal.type === 'time') {
			const doneSeconds = todayVerses * SECONDS_PER_VERSE;
			const target = goal.dailySeconds ?? 600;
			const percent = Math.min(100, Math.round((doneSeconds / target) * 100));
			todayProgress = {
				type: 'time',
				done: Math.round(doneSeconds / 60),
				target: Math.round(target / 60),
				unit: 'min',
				percent,
				isComplete: doneSeconds >= target
			};
		}
	}

	// Range progress (continuous)
	let rangeProgress: { done: number } | null = null;
	if (goal.type === 'range' && goal.rangeStart && goal.rangeEnd) {
		const [startSurah, startAyah] = goal.rangeStart.split(':').map(Number);
		const [endSurah, endAyah] = goal.rangeEnd.split(':').map(Number);
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
		rangeProgress = { done: readInRange.size };
	}

	// Duration progress for continuous goals
	let durationProgress: { elapsed: number; total: number; percent: number } | null = null;
	if (goal.period === 'continuous' && goal.duration) {
		const elapsed = Math.floor(
			(today.getTime() - goal.createdAt.getTime()) / 86400000
		);
		const percent = Math.min(100, Math.round((elapsed / goal.duration) * 100));
		durationProgress = { elapsed, total: goal.duration, percent };
	}

	return {
		goal: {
			...goal,
			createdAt: goal.createdAt.toISOString(),
			updatedAt: goal.updatedAt.toISOString()
		},
		streak,
		weekData,
		todayProgress,
		rangeProgress,
		durationProgress
	};
};

export const actions = {
	save: async ({ locals, request }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const type = formData.get('type') as string;
		const period = (formData.get('period') as string) ?? 'daily';
		const dailyPages = formData.get('dailyPages');
		const dailySeconds = formData.get('dailySeconds');
		const duration = formData.get('duration');
		const rangeStart = formData.get('rangeStart') as string;
		const rangeEnd = formData.get('rangeEnd') as string;

		if (!['time', 'pages', 'range'].includes(type)) {
			return fail(400, { error: 'Invalid goal type' });
		}
		if (!['daily', 'continuous'].includes(period)) {
			return fail(400, { error: 'Invalid period' });
		}
		if (type === 'pages' && period === 'daily' && (!dailyPages || Number(dailyPages) < 1)) {
			return fail(400, { error: 'Enter a daily page target' });
		}
		if (type === 'time' && period === 'daily' && (!dailySeconds || Number(dailySeconds) < 60)) {
			return fail(400, { error: 'Enter a daily time target' });
		}
		if (type === 'range' && (!rangeStart || !rangeEnd)) {
			return fail(400, { error: 'Select start and end verses' });
		}
		if (period === 'continuous' && (!duration || Number(duration) < 1)) {
			return fail(400, { error: 'Enter a duration in days' });
		}

		const values = {
			type,
			period,
			dailyPages: type === 'pages' && period === 'daily' ? Number(dailyPages) : null,
			dailySeconds: type === 'time' && period === 'daily' ? Number(dailySeconds) : null,
			duration: period === 'continuous' ? Number(duration) : null,
			rangeStart: type === 'range' ? rangeStart : null,
			rangeEnd: type === 'range' ? rangeEnd : null,
			updatedAt: new Date()
		};

		await db
			.insert(readingGoal)
			.values({ id: crypto.randomUUID(), userId: locals.user.id, ...values })
			.onConflictDoUpdate({ target: readingGoal.userId, set: values });

		return { success: true };
	},

	delete: async ({ locals }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));
		return { success: true };
	}
};
