import { redirect, fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { readingGoal, readingHistory } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { qfApiFetch, qfApiFetchAll, qfGetMushafId, QF_USER_API_URL, QF_USER_CLIENT_ID } from '$lib/server/qf-oauth';


interface QfActivityDay {
	id: string;
	date: string;
	ranges: string[];
	versesRead: number;
	pagesRead: number;
	secondsRead: number;
	dailyTargetSeconds?: number;
	dailyTargetPages?: number;
	dailyTargetRanges?: string[];
	progress: number;
}

function qfHasGoal(day: QfActivityDay) {
	return (day.dailyTargetSeconds ?? 0) > 0 || (day.dailyTargetPages ?? 0) > 0 || (day.dailyTargetRanges?.length ?? 0) > 0;
}

// ~10.3 verses per Quran page (604 pages / 6236 verses)
const VERSES_PER_PAGE = 10.3;
// rough seconds per verse when reading aloud or following along
const SECONDS_PER_VERSE = 30;

function formValue(formData: FormData, ...names: string[]) {
	for (const name of names) {
		const value = formData.get(name);
		if (value !== null) return value;
	}
	return null;
}

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

	if (locals.qfAccessToken) {
		const [goalStatus, days] = await Promise.all([
			qfApiFetch<{ success: boolean; data: unknown }>('goal/status', locals.qfAccessToken, { type: 'QURAN' }).catch(() => null),
			qfApiFetchAll<QfActivityDay>('activity-days', locals.qfAccessToken, { first: 1 }).catch(() => [] as QfActivityDay[]),
		]);
		const hasGoal = goalStatus?.data != null || (days.length > 0 && qfHasGoal(days[0]));
		if (hasGoal) redirect(302, '/reading-goal/progress');

		return { goal: null, streak: 0, weekData: [], todayProgress: null, isQfData: true };
	}

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
			.where(and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, todayStart)))
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
				and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, goal.createdAt))
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
		const elapsed = Math.floor((today.getTime() - goal.createdAt.getTime()) / 86400000);
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
	save: async ({ locals, request, cookies }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const type = formData.get('type') as string;
		const period = (formData.get('period') as string) ?? 'daily';
		const dailyPages = formValue(formData, 'dailyPages', 'daily_pages');
		const dailySeconds = formValue(formData, 'dailySeconds', 'daily_seconds', 'daily_seocnds');
		const duration = formData.get('duration');
		const rangeStart = formValue(formData, 'rangeStart', 'range_start') as string | null;
		const rangeEnd = formValue(formData, 'rangeEnd', 'range_end') as string | null;

		if (!['time', 'pages', 'range'].includes(type)) {
			return fail(400, { error: 'Invalid goal type' });
		}
		if (!['daily', 'continuous'].includes(period)) {
			return fail(400, { error: 'Invalid period' });
		}
		if (type === 'pages' && (!dailyPages || Number(dailyPages) < 1)) {
			return fail(400, { error: 'Enter a daily page target' });
		}
		if (type === 'time' && (!dailySeconds || Number(dailySeconds) < 60)) {
			return fail(400, { error: 'Enter a daily time target' });
		}
		if (type === 'range' && (!rangeStart || !rangeEnd)) {
			return fail(400, { error: 'Select start and end verses' });
		}
		if (period === 'continuous' && (!duration || Number(duration) < 1)) {
			return fail(400, { error: 'Enter a duration in days' });
		}

		if (locals.qfAccessToken) {
			const qfTypeMap = { time: 'QURAN_TIME', pages: 'QURAN_PAGES', range: 'QURAN_RANGE' } as const;
			const qfType = qfTypeMap[type as keyof typeof qfTypeMap];
			let amount: string | number;
			if (type === 'pages') amount = Number(dailyPages) || 1;
			else if (type === 'time') amount = Number(dailySeconds) || 600;
			else amount = `${rangeStart}-${rangeEnd}`;
			const qfBody: Record<string, unknown> = { type: qfType, amount };
			if (period === 'continuous' && duration) qfBody.duration = Number(duration);

			qfBody.category = 'QURAN';
			const mushafId = await qfGetMushafId(locals.qfAccessToken);
			const createUrl = new URL(`${QF_USER_API_URL}/auth/v1/goals`);
			createUrl.searchParams.set('mushafId', String(mushafId));
			const createRes = await fetch(createUrl.toString(), {
				method: 'POST',
				headers: { 'x-auth-token': locals.qfAccessToken, 'x-client-id': QF_USER_CLIENT_ID, 'Content-Type': 'application/json' },
				body: JSON.stringify(qfBody),
			});
			const createText = await createRes.text();
			if (!createRes.ok) {
				return fail(500, { error: `QF create failed ${createRes.status}: ${createText}` });
			}
			try {
				const goalId = (JSON.parse(createText) as { data?: { id?: string } })?.data?.id;
				if (goalId) cookies.set('qf_goal_id', goalId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
			} catch {}
			redirect(302, '/reading-goal/progress');
		}

		const values = {
			type,
			period,
			dailyPages: type === 'pages' ? Number(dailyPages) : null,
			dailySeconds: type === 'time' ? Number(dailySeconds) : null,
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
		if (locals.qfAccessToken) return fail(400, { error: 'Manage your goal on Quran.com.' });
		await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));
		return { success: true };
	}
};
