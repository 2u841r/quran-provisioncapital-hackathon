<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import GoalForm from '$lib/components/GoalForm.svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	type GoalType = 'time' | 'pages' | 'range';
	type Period = 'daily' | 'continuous';

	let goalType = $state<GoalType>('pages');
	let period = $state<Period>('daily');
	let dailyPagesInput = $state(1);
	let dailyMinutes = $state(10);
	let durationDays = $state(30);
	let targetDate = $state('');
	let rangeStart = $state('1:1');
	let rangeEnd = $state('114:6');
	let saving = $state(false);
	let deleting = $state(false);
	let showEdit = $state(false);

	let chapters = $state<{ id: number; name: string; verses: number }[]>([]);

	onMount(async () => {
		try {
			const res = await fetch('/api/proxy/content/chapters?language=en');
			const json = (await res.json()) as { chapters?: any[] };
			chapters = (json.chapters ?? []).map((ch: any) => ({
				id: ch.id,
				name: ch.name_simple,
				verses: ch.verses_count
			}));
		} catch {}
	});

	function verseLabel(verseKey: string) {
		const [s, a] = verseKey.split(':');
		const ch = chapters.find((c) => c.id === Number(s));
		return ch ? `${ch.name} ${s}:${a}` : verseKey;
	}

	const streakDays = $derived(data.streak ?? 0);
	const todayProgress = $derived(data.todayProgress);
	const isComplete = $derived(todayProgress?.isComplete ?? false);

	function startEdit() {
		if (data.goal) {
			goalType = data.goal.type;
			period = data.goal.period ?? 'daily';
			dailyPagesInput = data.goal.dailyPages ?? 1;
			dailyMinutes = Math.round((data.goal.dailySeconds ?? 600) / 60);
			const days = data.goal.duration ?? 30;
			durationDays = days;
			const d = new Date();
			d.setDate(d.getDate() + days);
			targetDate = d.toISOString().slice(0, 10);
			rangeStart = data.goal.rangeStart ?? '1:1';
			rangeEnd = data.goal.rangeEnd ?? '114:6';
		}
		showEdit = true;
	}
</script>

<svelte:head><title>Reading Goal</title></svelte:head>

<div class="sticky top-[3.5rem] z-20 border-b border-base-200 bg-base-100">
	<div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
		<a href="/" aria-label="Back" class="btn btn-circle btn-ghost btn-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-base font-semibold text-base-content">Reading Goal</h1>
	</div>
</div>

<div class="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
	{#if !data.goal || showEdit}
		<!-- ── SETUP FORM ── -->
		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
					showEdit = false;
				};
			}}
			class="flex flex-col gap-5"
		>
			<GoalForm
				bind:goalType
				bind:period
				bind:dailyPagesInput
				bind:dailyMinutes
				bind:durationDays
				bind:targetDate
				bind:rangeStart
				bind:rangeEnd
				{chapters}
			/>

			{#if form?.error}
				<p class="text-sm text-error">{form.error}</p>
			{/if}

			<div class="flex gap-2">
				{#if showEdit}
					<button type="button" class="btn flex-1 btn-ghost" onclick={() => (showEdit = false)}
						>Cancel</button
					>
				{/if}
				<button type="submit" class="btn flex-1 btn-primary" disabled={saving}>
					{saving ? 'Saving...' : showEdit ? 'Update goal' : 'Start journey'}
				</button>
			</div>
		</form>
	{:else if data.goal}
		<!-- ── PROGRESS ── -->

		<!-- Streak + week heatmap -->
		<div class="card rounded-2xl bg-base-200 p-5">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="text-3xl" aria-hidden="true">📖</div>
					<div>
						<div class="text-3xl leading-none font-bold text-base-content">{streakDays}</div>
						<div class="text-sm text-base-content/50">day streak</div>
					</div>
				</div>
				<div class="text-xs text-base-content/40">This week</div>
			</div>
			<div class="flex justify-between gap-1">
				{#each data.weekData as day (day.date)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div
							class="aspect-square w-full max-w-9 rounded-lg {day.hasRead
								? 'bg-primary'
								: day.isFuture
									? 'bg-base-300/40'
									: 'bg-base-300'}"
							title={day.hasRead ? 'Read' : day.isFuture ? 'Upcoming' : 'Missed'}
						></div>
						<span
							class="text-[10px] {day.isToday
								? 'font-bold text-base-content'
								: 'text-base-content/40'}">{day.dayName}</span
						>
					</div>
				{/each}
			</div>
		</div>

		<!-- Daily progress -->
		{#if todayProgress}
			<div class="card rounded-2xl bg-base-200 p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-semibold">Today's progress</h2>
					{#if isComplete}<span class="badge badge-sm badge-success">Complete</span>{/if}
				</div>
				<div class="mb-3 flex items-end gap-2">
					<span class="text-4xl font-bold text-base-content">{todayProgress.done}</span>
					<span class="mb-1 text-base-content/40"
						>/ {todayProgress.target} {todayProgress.unit}</span
					>
				</div>
				<div class="h-3 w-full rounded-full bg-base-300">
					<div
						class="h-3 rounded-full transition-all {isComplete ? 'bg-success' : 'bg-primary'}"
						style="width: {todayProgress.percent}%"
					></div>
				</div>
				<p class="mt-2 text-xs text-base-content/40">
					{#if isComplete}Goal complete for today.
					{:else if todayProgress.unit === 'min'}~{todayProgress.target - todayProgress.done} min remaining
					{:else}{(todayProgress.target - todayProgress.done).toFixed(1)}
						{todayProgress.unit} remaining{/if}
				</p>
				<a href="/" class="btn mt-4 w-full btn-sm btn-primary">Continue reading</a>
			</div>
		{/if}

		<!-- Range progress -->
		{#if data.goal.type === 'range' && data.goal.rangeStart && data.goal.rangeEnd}
			<div class="card rounded-2xl bg-base-200 p-5">
				<h2 class="mb-2 font-semibold">Range progress</h2>
				<div class="mb-3 text-sm text-base-content/60">
					{verseLabel(data.goal.rangeStart)} → {verseLabel(data.goal.rangeEnd)}
				</div>
				{#if data.rangeProgress}
					<div class="mb-1 text-3xl font-bold">
						{data.rangeProgress.done}
						<span class="text-base font-normal text-base-content/40">verses read</span>
					</div>
				{/if}
				<a
					href={`/${data.goal.rangeStart.split(':')[0]}#${data.goal.rangeStart}`}
					class="btn mt-3 w-full btn-sm btn-primary">Continue reading</a
				>
			</div>
		{/if}

		<!-- Duration progress -->
		{#if data.durationProgress && data.goal.period === 'continuous'}
			<div class="card rounded-2xl bg-base-200 p-5">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="font-semibold">Time progress</h2>
					<span class="text-sm text-base-content/50"
						>Day {data.durationProgress.elapsed} of {data.durationProgress.total}</span
					>
				</div>
				<div class="h-2.5 w-full rounded-full bg-base-300">
					<div
						class="h-2.5 rounded-full bg-secondary transition-all"
						style="width: {data.durationProgress.percent}%"
					></div>
				</div>
				<p class="mt-2 text-xs text-base-content/40">
					{Math.max(0, data.durationProgress.total - data.durationProgress.elapsed)} days remaining
				</p>
			</div>
		{/if}

		<!-- Goal summary + actions -->
		<div class="card rounded-2xl bg-base-200 p-5">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="font-semibold">Current goal</h2>
				<button class="btn btn-ghost btn-xs" onclick={startEdit}>Edit</button>
			</div>
			<div class="flex flex-col gap-1 text-sm text-base-content/60">
				{#if data.goal.type === 'pages'}
					<span
						><span class="font-medium text-base-content">{data.goal.dailyPages} pages/day</span> · {data
							.goal.period === 'daily'
							? 'Daily goal'
							: data.goal.duration
								? `For ${data.goal.duration} days`
								: 'Over a duration'}</span
					>
				{:else if data.goal.type === 'time'}
					<span
						><span class="font-medium text-base-content"
							>{Math.round((data.goal.dailySeconds ?? 0) / 60)} min/day</span
						>
						· {data.goal.period === 'daily'
							? 'Daily goal'
							: data.goal.duration
								? `For ${data.goal.duration} days`
								: 'Over a duration'}</span
					>
				{:else}
					<span
						>Range: <span class="font-medium text-base-content"
							>{verseLabel(data.goal.rangeStart)} – {verseLabel(data.goal.rangeEnd)}</span
						></span
					>
					{#if data.goal.duration}<span
							>Over a duration: <span class="font-medium text-base-content"
								>{data.goal.duration} days</span
							></span
						>{/if}
				{/if}
			</div>
			<div class="mt-2 text-xs text-base-content/30">
				Started {new Date(data.goal.createdAt).toLocaleDateString('en', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})}
			</div>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
					};
				}}
				class="mt-4"
			>
				<button type="submit" class="btn w-full btn-outline btn-sm btn-error" disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete goal'}
				</button>
			</form>
		</div>
	{/if}
</div>
