<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import GoalForm from '$lib/components/GoalForm.svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	type GoalType = 'time' | 'pages' | 'range';
	type Period = 'daily' | 'continuous';

	let showEdit = $state(false);
	let saving = $state(false);
	let deleting = $state(false);

	let goalType = $state<GoalType>((data.goal?.type as GoalType) ?? 'pages');
	let period = $state<Period>((data.goal?.period as Period) ?? 'daily');
	let dailyPagesInput = $state(data.goal?.dailyPages ?? 1);
	let dailyMinutes = $state(Math.round((data.goal?.dailySeconds ?? 600) / 60));
	let durationDays = $state(data.goal?.duration ?? 30);
	let rangeStart = $state(data.goal?.rangeStart ?? '1:1');
	let rangeEnd = $state(data.goal?.rangeEnd ?? '114:6');
	let targetDate = $state('');

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

		if (data.goal?.duration) {
			const d = new Date();
			d.setDate(d.getDate() + data.goal.duration);
			targetDate = d.toISOString().slice(0, 10);
		}
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
		goalType = data.goal?.type ?? 'pages';
		period = data.goal?.period ?? 'daily';
		dailyPagesInput = data.goal?.dailyPages ?? 1;
		dailyMinutes = Math.round((data.goal?.dailySeconds ?? 600) / 60);
		const days = data.goal?.duration ?? 30;
		durationDays = days;
		const d = new Date();
		d.setDate(d.getDate() + days);
		targetDate = d.toISOString().slice(0, 10);
		rangeStart = data.goal?.rangeStart ?? '1:1';
		rangeEnd = data.goal?.rangeEnd ?? '114:6';
		showEdit = true;
	}
</script>

<svelte:head><title>Reading Progress</title></svelte:head>

<div class="sticky top-[3.5rem] z-20 border-b border-base-200 bg-base-100">
	<div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
		<a href="/reading-goal" aria-label="Back" class="btn btn-circle btn-ghost btn-sm">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
			</svg>
		</a>
		<h1 class="text-base font-semibold text-base-content">Reading Progress</h1>
		{#if !showEdit}
			<button class="btn btn-ghost btn-xs ml-auto" onclick={startEdit}>Edit goal</button>
		{/if}
	</div>
</div>

<div class="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">

	{#if showEdit}
		<!-- Edit form -->
		<form
			method="POST"
			action="?/update"
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
			<input type="hidden" name="goalId" value={data.goal?.id ?? ''} />
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
				<button type="button" class="btn btn-ghost flex-1" onclick={() => (showEdit = false)}>Cancel</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Update goal'}</button>
			</div>
		</form>

	{:else}

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
						<div class="aspect-square w-full max-w-9 rounded-lg {day.hasRead ? 'bg-primary' : day.isFuture ? 'bg-base-300/40' : 'bg-base-300'}"
							title={day.hasRead ? 'Read' : 'Missed'}></div>
						<span class="text-[10px] {day.isToday ? 'font-bold text-base-content' : 'text-base-content/40'}">{day.dayName}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Today's progress -->
		{#if todayProgress && todayProgress.type !== 'range'}
			<div class="card rounded-2xl bg-base-200 p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-semibold">Today's progress</h2>
					{#if isComplete}<span class="badge badge-sm badge-success">Complete</span>{/if}
				</div>
				<div class="mb-3 flex items-end gap-2">
					<span class="text-4xl font-bold text-base-content">{todayProgress.done}</span>
					<span class="mb-1 text-base-content/40">/ {todayProgress.target} {todayProgress.unit}</span>
				</div>
				<div class="h-3 w-full rounded-full bg-base-300">
					<div class="h-3 rounded-full transition-all {isComplete ? 'bg-success' : 'bg-primary'}" style="width: {todayProgress.percent}%"></div>
				</div>
				<p class="mt-2 text-xs text-base-content/40">
					{#if isComplete}Goal complete for today.
					{:else if todayProgress.unit === 'min'}~{todayProgress.amountLeft} min remaining
					{:else}{todayProgress.amountLeft} {todayProgress.unit} remaining{/if}
				</p>
				<a href="/" class="btn btn-primary btn-sm mt-4 w-full">Continue reading</a>
			</div>
		{/if}

		<!-- Range goal progress -->
		{#if data.goal?.type === 'range'}
			<div class="card rounded-2xl bg-base-200 p-5">
				<h2 class="mb-2 font-semibold">Range goal</h2>
				{#if data.goal.rangeStart && data.goal.rangeEnd}
					<div class="mb-3 text-sm text-base-content/60">
						{#if chapters.length > 0}
							{verseLabel(data.goal.rangeStart)} to {verseLabel(data.goal.rangeEnd)}
						{:else}
							{data.goal.rangeStart} to {data.goal.rangeEnd}
						{/if}
					</div>
				{/if}
				{#if todayProgress?.type === 'range'}
					<div class="mb-3">
						<div class="mb-1 flex justify-between text-xs text-base-content/50">
							<span>Progress</span><span>{todayProgress.percent}%</span>
						</div>
						<div class="h-3 w-full rounded-full bg-base-300">
							<div class="h-3 rounded-full bg-primary transition-all" style="width: {todayProgress.percent}%"></div>
						</div>
					</div>
				{/if}
				{#if data.rangeProgress}
					<div class="text-2xl font-bold">{data.rangeProgress.done} <span class="text-sm font-normal text-base-content/40">verses read</span></div>
				{/if}
				{#if todayProgress?.nextVerseToRead}
					<a href="/{todayProgress.nextVerseToRead.split(':')[0]}#{todayProgress.nextVerseToRead}" class="btn btn-primary btn-sm mt-3 w-full">Continue reading</a>
				{:else if data.goal.rangeStart}
					<a href="/{data.goal.rangeStart.split(':')[0]}#{data.goal.rangeStart}" class="btn btn-primary btn-sm mt-3 w-full">Continue reading</a>
				{/if}
			</div>
		{/if}

		<!-- Duration progress -->
		{#if data.durationProgress && data.goal?.period === 'continuous'}
			<div class="card rounded-2xl bg-base-200 p-5">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="font-semibold">Time progress</h2>
					<span class="text-sm text-base-content/50">Day {data.durationProgress.elapsed} of {data.durationProgress.total}</span>
				</div>
				<div class="h-2.5 w-full rounded-full bg-base-300">
					<div class="h-2.5 rounded-full bg-secondary transition-all" style="width: {data.durationProgress.percent}%"></div>
				</div>
				<p class="mt-2 text-xs text-base-content/40">
					{Math.max(0, data.durationProgress.total - data.durationProgress.elapsed)} days remaining
				</p>
			</div>
		{/if}

		<!-- Goal summary -->
		<div class="card rounded-2xl bg-base-200 p-5">
			<h2 class="mb-3 font-semibold">Current goal</h2>
			<div class="flex flex-col gap-1 text-sm text-base-content/60">
				{#if data.goal?.type === 'pages'}
					<span><span class="font-medium text-base-content">{data.goal.dailyPages} pages/day</span> · Daily goal</span>
				{:else if data.goal?.type === 'time'}
					<span><span class="font-medium text-base-content">{Math.round((data.goal.dailySeconds ?? 0) / 60)} min/day</span> · Daily goal</span>
				{:else if data.goal?.type === 'range'}
					<span>Range goal</span>
				{/if}
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
				<button type="submit" class="btn btn-outline btn-error btn-sm w-full" disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete goal'}
				</button>
			</form>
		</div>

	{/if}
</div>
