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
	remainingDailyTargetRanges?: string[];
	progress: number; // 0–1
	mushafId?: number;
}

interface QfStreak {
	id: string;
	days: number;
	status: string;
	type: string;
}

interface QfGoalStatus {
	id: string;
	type: 'QURAN_TIME' | 'QURAN_PAGES' | 'QURAN_RANGE';
	targetAmount: string;
	duration?: number;
	isCompleted: boolean;
	createdAt: string;
	updatedAt: string;
	progress: {
		percent: number;
		amountLeft: number;
		nextVerseToRead?: string;
		daysLeft?: number;
	};
}

function startOfDay(date: Date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function buildWeekDataFromStrings(activityDates: Set<string>, today: Date) {
	const days = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(today.getDate() - i);
		const dateStr = d.toISOString().split('T')[0];
		days.push({
			date: d.toISOString(),
			dayName: d.toLocaleDateString('en', { weekday: 'short' }),
			isToday: i === 0,
			isFuture: false,
			hasRead: activityDates.has(dateStr)
		});
	}
	return days;
}

function buildWeekDataFromDates(readDates: Date[], today: Date) {
	const readSet = new Set(readDates.map((d) => startOfDay(d).toISOString().split('T')[0]));
	const days = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(today.getDate() - i);
		const dateStr = d.toISOString().split('T')[0];
		days.push({
			date: d.toISOString(),
			dayName: d.toLocaleDateString('en', { weekday: 'short' }),
			isToday: i === 0,
			isFuture: false,
			hasRead: readSet.has(dateStr)
		});
	}
	return days;
}

function calcStreak(readDates: Date[], today: Date): number {
	if (readDates.length === 0) return 0;
	const todayMs = startOfDay(today).getTime();
	const uniqueDays = [...new Set(readDates.map((d) => startOfDay(d).getTime()))].sort((a, b) => b - a);
	if (uniqueDays[0] < todayMs - 86400000) return 0;
	let streak = 0;
	let expected = uniqueDays[0] === todayMs ? todayMs : todayMs - 86400000;
	for (const day of uniqueDays) {
		if (day === expected) { streak++; expected -= 86400000; }
		else if (day < expected) break;
	}
	return streak;
}

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user) redirect(302, '/login?next=/reading-goal/progress');

	if (locals.qfAccessToken) {
		const mushafIdForLoad = await qfGetMushafId(locals.qfAccessToken);
		const [goalStatusRes, activityDays, streaks] = await Promise.all([
			Promise.resolve(null),
			qfApiFetchAll<QfActivityDay>('activity-days', locals.qfAccessToken, { first: 7 }).catch(() => [] as QfActivityDay[]),
			qfApiFetchAll<QfStreak>('streaks', locals.qfAccessToken, { first: 1, type: 'QURAN' }).catch(() => [] as QfStreak[]),
		]);

		activityDays.sort((a, b) => b.date.localeCompare(a.date));
		const todayActivity = activityDays[0];
		const hasGoalFromActivity = todayActivity && (
			(todayActivity.dailyTargetSeconds ?? 0) > 0 ||
			(todayActivity.dailyTargetPages ?? 0) > 0 ||
			(todayActivity.dailyTargetRanges?.length ?? 0) > 0
		);

		// Only redirect if neither goal/status nor activity-days show a goal
		if (!goalStatusRes?.data && !hasGoalFromActivity) redirect(302, '/reading-goal');

		const streak = streaks[0]?.days ?? 0;

		const activeDates = new Set(
			activityDays.filter((d) => d.versesRead > 0 || d.ranges?.length > 0).map((d) => d.date.split('T')[0])
		);
		const weekData = buildWeekDataFromStrings(activeDates, new Date());

		const goalTypeMap = { QURAN_TIME: 'time', QURAN_PAGES: 'pages', QURAN_RANGE: 'range' } as const;
		let todayProgress: { type: string; percent: number; done: number; target: number; unit: string; amountLeft: number; isComplete: boolean; nextVerseToRead?: string } | null = null;
		let goalType: 'time' | 'pages' | 'range' = 'time';
		let goal: Record<string, unknown>;

		if (goalStatusRes?.data) {
			const qfGoal = goalStatusRes.data;
			goalType = goalTypeMap[qfGoal.type] ?? 'time';
			const targetAmount = Number(qfGoal.targetAmount) || 0;
			const percent = Math.min(100, Math.round(qfGoal.progress.percent));
			const isComplete = qfGoal.isCompleted || percent >= 100;

			if (goalType === 'time') {
				const targetMin = Math.round(targetAmount / 60);
				const amountLeftMin = Math.ceil(qfGoal.progress.amountLeft / 60);
				const doneMin = Math.max(0, targetMin - amountLeftMin);
				todayProgress = { type: 'time', percent, done: doneMin, target: targetMin, unit: 'min', amountLeft: amountLeftMin, isComplete };
			} else if (goalType === 'pages') {
				const amountLeft = Math.round(qfGoal.progress.amountLeft * 10) / 10;
				const done = Math.max(0, Math.round((targetAmount - amountLeft) * 10) / 10);
				todayProgress = { type: 'pages', percent, done, target: targetAmount, unit: 'pages', amountLeft, isComplete };
			} else if (goalType === 'range') {
				todayProgress = { type: 'range', percent, done: 0, target: 0, unit: '', amountLeft: qfGoal.progress.amountLeft, isComplete, nextVerseToRead: qfGoal.progress.nextVerseToRead };
			}

			goal = {
				id: qfGoal.id,
				type: goalType,
				period: qfGoal.duration ? 'continuous' : 'daily',
				dailyPages: goalType === 'pages' ? targetAmount : null,
				dailySeconds: goalType === 'time' ? targetAmount : null,
				rangeStart: todayActivity?.dailyTargetRanges?.[0]?.split('-')[0] ?? null,
				rangeEnd: todayActivity?.dailyTargetRanges?.[todayActivity.dailyTargetRanges.length - 1]?.split('-')[1] ?? null,
				duration: qfGoal.duration ?? null,
				createdAt: qfGoal.createdAt,
				isQfManaged: true,
			};
		} else {
			// Fallback: derive from activity-days when goal/status unavailable
			if ((todayActivity.dailyTargetSeconds ?? 0) > 0) {
				goalType = 'time';
				const target = todayActivity.dailyTargetSeconds!;
				const done = todayActivity.secondsRead;
				const percent = Math.min(100, Math.round((done / target) * 100));
				todayProgress = { type: 'time', percent, done: Math.round(done / 60), target: Math.round(target / 60), unit: 'min', amountLeft: Math.ceil(Math.max(0, target - done) / 60), isComplete: percent >= 100 };
			} else if ((todayActivity.dailyTargetPages ?? 0) > 0) {
				goalType = 'pages';
				const target = todayActivity.dailyTargetPages!;
				const done = todayActivity.pagesRead;
				const percent = Math.min(100, Math.round((done / target) * 100));
				todayProgress = { type: 'pages', percent, done: Math.round(done * 10) / 10, target, unit: 'pages', amountLeft: Math.max(0, Math.ceil((target - done) * 10) / 10), isComplete: percent >= 100 };
			} else if (todayActivity.dailyTargetRanges?.length) {
				goalType = 'range';
				const percent = Math.min(100, Math.round(todayActivity.progress * 100));
				const nextVerse = todayActivity.remainingDailyTargetRanges?.[0]?.split('-')[0];
				todayProgress = { type: 'range', percent, done: 0, target: 0, unit: '', amountLeft: todayActivity.remainingDailyTargetRanges?.length ?? 0, isComplete: percent >= 100, nextVerseToRead: nextVerse };
			}

			goal = {
				type: goalType,
				period: 'daily',
				dailyPages: todayActivity.dailyTargetPages ?? null,
				dailySeconds: todayActivity.dailyTargetSeconds ?? null,
				rangeStart: todayActivity.dailyTargetRanges?.[0]?.split('-')[0] ?? null,
				rangeEnd: todayActivity.dailyTargetRanges?.[todayActivity.dailyTargetRanges.length - 1]?.split('-')[1] ?? null,
				duration: null,
				createdAt: new Date().toISOString(),
				isQfManaged: true,
			};
		}

		return { goal, streak, weekData, todayProgress, durationProgress: null, isQfData: true };
	}

	// Local DB path
	const today = new Date();
	const todayStart = startOfDay(today);
	const VERSES_PER_PAGE = 10.3;
	const SECONDS_PER_VERSE = 30;

	const [goal] = await db.select().from(readingGoal).where(eq(readingGoal.userId, locals.user.id)).limit(1);
	if (!goal) redirect(302, '/reading-goal');

	const sixtyDaysAgo = new Date(today);
	sixtyDaysAgo.setDate(today.getDate() - 60);

	const [recentHistory, todayHistory] = await Promise.all([
		db.select({ readAt: readingHistory.readAt }).from(readingHistory).where(and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, sixtyDaysAgo))),
		db.select({ verseKey: readingHistory.verseKey }).from(readingHistory).where(and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, todayStart)))
	]);

	const streak = calcStreak(recentHistory.map((h) => h.readAt), today);
	const weekData = buildWeekDataFromDates(recentHistory.map((h) => h.readAt), today);
	const todayVerses = todayHistory.length;

	let todayProgress: { type: string; done: number; target: number; unit: string; percent: number; amountLeft: number; isComplete: boolean } | null = null;
	if (goal.type === 'pages') {
		const donePages = Math.round((todayVerses / VERSES_PER_PAGE) * 10) / 10;
		const target = goal.dailyPages ?? 1;
		const percent = Math.min(100, Math.round((donePages / target) * 100));
		todayProgress = { type: 'pages', done: donePages, target, unit: 'pages', percent, amountLeft: Math.max(0, Math.round((target - donePages) * 10) / 10), isComplete: donePages >= target };
	} else if (goal.type === 'time') {
		const doneSeconds = todayVerses * SECONDS_PER_VERSE;
		const target = goal.dailySeconds ?? 600;
		const percent = Math.min(100, Math.round((doneSeconds / target) * 100));
		todayProgress = { type: 'time', done: Math.round(doneSeconds / 60), target: Math.round(target / 60), unit: 'min', percent, amountLeft: Math.ceil(Math.max(0, target - doneSeconds) / 60), isComplete: doneSeconds >= target };
	}

	let rangeProgress: { done: number } | null = null;
	if (goal.type === 'range' && goal.rangeStart && goal.rangeEnd) {
		const [startSurah, startAyah] = goal.rangeStart.split(':').map(Number);
		const [endSurah, endAyah] = goal.rangeEnd.split(':').map(Number);
		const allHistory = await db.select({ verseKey: readingHistory.verseKey }).from(readingHistory).where(and(eq(readingHistory.userId, locals.user.id), gte(readingHistory.readAt, goal.createdAt)));
		const readInRange = new Set<string>();
		for (const { verseKey } of allHistory) {
			const [s, a] = verseKey.split(':').map(Number);
			if ((s > startSurah || (s === startSurah && a >= startAyah)) && (s < endSurah || (s === endSurah && a <= endAyah))) readInRange.add(verseKey);
		}
		rangeProgress = { done: readInRange.size };
	}

	let durationProgress: { elapsed: number; total: number; percent: number } | null = null;
	if (goal.period === 'continuous' && goal.duration) {
		const elapsed = Math.floor((today.getTime() - goal.createdAt.getTime()) / 86400000);
		durationProgress = { elapsed, total: goal.duration, percent: Math.min(100, Math.round((elapsed / goal.duration) * 100)) };
	}

	return {
		goal: { ...goal, period: goal.period ?? 'daily', createdAt: goal.createdAt.toISOString(), updatedAt: goal.updatedAt.toISOString(), isQfManaged: false },
		streak, weekData, todayProgress, rangeProgress, durationProgress, isQfData: false
	};
};

function formValue(formData: FormData, ...names: string[]) {
	for (const name of names) { const v = formData.get(name); if (v !== null) return v; }
	return null;
}

export const actions = {
	update: async ({ locals, request, cookies }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const type = formData.get('type') as string;
		const period = (formData.get('period') as string) ?? 'daily';
		const dailyPages = formValue(formData, 'dailyPages');
		const dailySeconds = formValue(formData, 'dailySeconds');
		const duration = formData.get('duration');
		const rangeStart = formValue(formData, 'rangeStart') as string | null;
		const rangeEnd = formValue(formData, 'rangeEnd') as string | null;

		if (!['time', 'pages', 'range'].includes(type)) return fail(400, { error: 'Invalid goal type' });

		if (locals.qfAccessToken) {
			const goalId = formData.get('goalId') as string | null;
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
			const storedGoalId = cookies.get('qf_goal_id');

			if (storedGoalId) {
				const putUrl = new URL(`${QF_USER_API_URL}/auth/v1/goals/${storedGoalId}`);
				putUrl.searchParams.set('mushafId', String(mushafId));
				const putRes = await fetch(putUrl.toString(), {
					method: 'PUT',
					headers: { 'x-auth-token': locals.qfAccessToken, 'x-client-id': QF_USER_CLIENT_ID, 'Content-Type': 'application/json' },
					body: JSON.stringify(qfBody),
				});
				if (!putRes.ok) {
					const text = await putRes.text();
					return fail(500, { error: `QF update failed ${putRes.status}: ${text}` });
				}
				return { success: true };
			}

			// No stored ID — create new
			const postUrl = new URL(`${QF_USER_API_URL}/auth/v1/goals`);
			postUrl.searchParams.set('mushafId', String(mushafId));
			const postRes = await fetch(postUrl.toString(), {
				method: 'POST',
				headers: { 'x-auth-token': locals.qfAccessToken, 'x-client-id': QF_USER_CLIENT_ID, 'Content-Type': 'application/json' },
				body: JSON.stringify(qfBody),
			});
			if (!postRes.ok) {
				const text = await postRes.text();
				return fail(500, { error: `QF update failed ${postRes.status}: ${text}` });
			}
			try {
				const newId = (JSON.parse(await postRes.text()) as { data?: { id?: string } })?.data?.id;
				if (newId) cookies.set('qf_goal_id', newId, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
			} catch {}
			return { success: true };
		}

		const values = {
			type, period,
			dailyPages: type === 'pages' ? Number(dailyPages) : null,
			dailySeconds: type === 'time' ? Number(dailySeconds) : null,
			duration: period === 'continuous' ? Number(duration) : null,
			rangeStart: type === 'range' ? rangeStart : null,
			rangeEnd: type === 'range' ? rangeEnd : null,
			updatedAt: new Date()
		};
		await db.insert(readingGoal).values({ id: crypto.randomUUID(), userId: locals.user.id, ...values }).onConflictDoUpdate({ target: readingGoal.userId, set: values });
		return { success: true };
	},

	delete: async ({ locals, request, cookies }: RequestEvent) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		if (locals.qfAccessToken) {
			const storedGoalId = cookies.get('qf_goal_id');
			if (storedGoalId) {
				const delUrl = new URL(`${QF_USER_API_URL}/auth/v1/goals/${storedGoalId}`);
				delUrl.searchParams.set('category', 'QURAN');
				const delRes = await fetch(delUrl.toString(), {
					method: 'DELETE',
					headers: { 'x-auth-token': locals.qfAccessToken, 'x-client-id': QF_USER_CLIENT_ID },
				});
				const delText = await delRes.text().catch(() => '');
				if (delRes.ok || delRes.status === 404) {
					cookies.delete('qf_goal_id', { path: '/' });
				} else {
					return fail(500, { error: `QF delete failed ${delRes.status}: ${delText}` });
				}
			}
			redirect(302, '/reading-goal');
		}

		await db.delete(readingGoal).where(eq(readingGoal.userId, locals.user.id));
		redirect(302, '/reading-goal');
	}
};
