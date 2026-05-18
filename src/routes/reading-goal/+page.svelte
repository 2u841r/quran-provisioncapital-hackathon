<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	type GoalType = 'time' | 'pages' | 'range';
	type Period = 'daily' | 'continuous';

	let goalType = $state<GoalType>('pages');
	let period = $state<Period>('daily');
	let dailyPagesInput = $state(1);
	let dailyMinutes = $state(10);
	let durationDays = $state(30);
	let rangeStart = $state('1:1');
	let rangeEnd = $state('114:6');
	let saving = $state(false);
	let deleting = $state(false);
	let showEdit = $state(false);

	const dailySeconds = $derived(dailyMinutes * 60);

	let chapters = $state<{ id: number; name: string; verses: number }[]>([]);

	onMount(async () => {
		try {
			const res = await fetch('/api/proxy/content/chapters?language=en');
			const json = await res.json() as { chapters?: any[] };
			chapters = (json.chapters ?? []).map((ch: any) => ({
				id: ch.id,
				name: ch.name_simple,
				verses: ch.verses_count
			}));
		} catch {}
	});

	let rangeStartSurah = $derived(Number(rangeStart.split(':')[0]) || 1);
	let rangeStartAyah = $derived(Number(rangeStart.split(':')[1]) || 1);
	let rangeEndSurah = $derived(Number(rangeEnd.split(':')[0]) || 114);
	let rangeEndAyah = $derived(Number(rangeEnd.split(':')[1]) || 6);

	function verseOptions(chapterId: number) {
		const ch = chapters.find((c) => c.id === chapterId);
		if (!ch) return [];
		return Array.from({ length: ch.verses }, (_, i) => i + 1);
	}

	function verseLabel(verseKey: string) {
		const [s, a] = verseKey.split(':');
		const ch = chapters.find((c) => c.id === Number(s));
		return ch ? `${ch.name} ${s}:${a}` : verseKey;
	}

	const DURATION_PRESETS = [
		{ days: 7, label: '1 week' },
		{ days: 30, label: '30 days' },
		{ days: 90, label: '3 months' },
		{ days: 180, label: '6 months' },
		{ days: 365, label: '1 year' }
	];

	const streakDays = $derived(data.streak ?? 0);
	const todayProgress = $derived(data.todayProgress);
	const isComplete = $derived(todayProgress?.isComplete ?? false);

	function startEdit() {
		if (data.goal) {
			goalType = data.goal.type;
			period = data.goal.period ?? 'daily';
			dailyPagesInput = data.goal.dailyPages ?? 1;
			dailyMinutes = Math.round((data.goal.dailySeconds ?? 600) / 60);
			durationDays = data.goal.duration ?? 30;
			rangeStart = data.goal.rangeStart ?? '1:1';
			rangeEnd = data.goal.rangeEnd ?? '114:6';
		}
		showEdit = true;
	}
</script>

<svelte:head><title>Reading Goal</title></svelte:head>

<div class="sticky top-[3.5rem] z-20 bg-base-100 border-b border-base-200">
	<div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
		<a href="/" aria-label="Back" class="btn btn-ghost btn-sm btn-circle">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
			</svg>
		</a>
		<h1 class="text-base font-semibold text-base-content">Reading Goal</h1>
	</div>
</div>

<div class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

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
		<input type="hidden" name="type" value={goalType} />
		<input type="hidden" name="period" value={period} />
		<input type="hidden" name="dailyPages" value={dailyPagesInput} />
		<input type="hidden" name="dailySeconds" value={dailySeconds} />
		<input type="hidden" name="duration" value={durationDays} />
		<input type="hidden" name="rangeStart" value={rangeStart} />
		<input type="hidden" name="rangeEnd" value={rangeEnd} />

		<!-- Goal type -->
		<fieldset>
			<legend class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">Goal type</legend>
			<div class="flex gap-2">
				{#each [
					{ t: 'time' as GoalType, label: 'Time' },
					{ t: 'pages' as GoalType, label: 'Pages' },
					{ t: 'range' as GoalType, label: 'Range' }
				] as opt (opt.t)}
					<button
						type="button"
						class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all {goalType === opt.t ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/60 hover:border-base-content/20'}"
						onclick={() => { goalType = opt.t; if (opt.t === 'range') period = 'continuous'; }}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</fieldset>

		<!-- Period (hidden for range — always continuous) -->
		{#if goalType !== 'range'}
			<fieldset>
				<legend class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">Frequency</legend>
				<div class="flex flex-col gap-2 sm:flex-row">
					<button
						type="button"
						class="flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all {period === 'daily' ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-base-content/20'}"
						onclick={() => (period = 'daily')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="mt-0.5 shrink-0 {period === 'daily' ? 'text-primary' : 'text-base-content/40'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
						</svg>
						<div>
							<div class="font-semibold text-sm {period === 'daily' ? 'text-primary' : 'text-base-content'}">Daily goal</div>
							<div class="text-xs text-base-content/50 mt-0.5">Your goal will reset every day</div>
						</div>
					</button>
					<button
						type="button"
						class="flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all {period === 'continuous' ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-base-content/20'}"
						onclick={() => (period = 'continuous')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="mt-0.5 shrink-0 {period === 'continuous' ? 'text-primary' : 'text-base-content/40'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
						<div>
							<div class="font-semibold text-sm {period === 'continuous' ? 'text-primary' : 'text-base-content'}">Over a duration</div>
							<div class="text-xs text-base-content/50 mt-0.5">Progress calculated over a number of days</div>
						</div>
					</button>
				</div>
			</fieldset>
		{/if}

		<!-- Amount -->
		{#if goalType === 'time'}
			<div>
				<label for="dailyMinsInput" class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">Minutes per day</label>
				<div class="flex items-center gap-3">
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (dailyMinutes = Math.max(1, dailyMinutes - 1))}>-</button>
					<input id="dailyMinsInput" type="number" min="1" max="480" bind:value={dailyMinutes} class="input input-bordered w-24 text-center text-lg font-bold" />
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (dailyMinutes = Math.min(480, dailyMinutes + 1))}>+</button>
				</div>
				<div class="flex gap-2 mt-3 flex-wrap">
					{#each [5, 10, 15, 20, 30] as p (p)}
						<button type="button" class="btn btn-xs rounded-full {dailyMinutes === p ? 'btn-primary' : 'btn-ghost border border-base-300'}" onclick={() => (dailyMinutes = p)}>{p} min</button>
					{/each}
				</div>
			</div>

		{:else if goalType === 'pages'}
			<div>
				<label for="dailyPagesEl" class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">Pages per day</label>
				<div class="flex items-center gap-3">
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (dailyPagesInput = Math.max(1, dailyPagesInput - 1))}>-</button>
					<input id="dailyPagesEl" type="number" min="1" max="604" bind:value={dailyPagesInput} class="input input-bordered w-24 text-center text-lg font-bold" />
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (dailyPagesInput = Math.min(604, dailyPagesInput + 1))}>+</button>
				</div>
				<p class="text-xs text-base-content/40 mt-2">{dailyPagesInput} pages/day = full Quran in ~{Math.round(604 / dailyPagesInput)} days</p>
				<div class="flex gap-2 mt-2 flex-wrap">
					{#each [1, 2, 4, 8] as p (p)}
						<button type="button" class="btn btn-xs rounded-full {dailyPagesInput === p ? 'btn-primary' : 'btn-ghost border border-base-300'}" onclick={() => (dailyPagesInput = p)}>{p} {p === 1 ? 'page' : 'pages'}/day</button>
					{/each}
				</div>
			</div>

		{:else}
			<!-- Range -->
			<div class="flex flex-col gap-3">
				<div>
					<label for="rsStartSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">From</label>
					<div class="flex gap-2">
						<select id="rsStartSurah" class="select select-bordered flex-1" value={rangeStartSurah} onchange={(e) => { const s = Number((e.target as HTMLSelectElement).value); rangeStart = `${s}:1`; }}>
							{#each chapters as ch (ch.id)}<option value={ch.id}>{ch.id}. {ch.name}</option>{/each}
						</select>
						<select aria-label="Start verse" class="select select-bordered w-24" value={rangeStartAyah} onchange={(e) => { rangeStart = `${rangeStartSurah}:${(e.target as HTMLSelectElement).value}`; }}>
							{#each verseOptions(rangeStartSurah) as v (v)}<option value={v}>{v}</option>{/each}
						</select>
					</div>
				</div>
				<div>
					<label for="rsEndSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">To</label>
					<div class="flex gap-2">
						<select id="rsEndSurah" class="select select-bordered flex-1" value={rangeEndSurah} onchange={(e) => { const s = Number((e.target as HTMLSelectElement).value); const ch = chapters.find(c => c.id === s); rangeEnd = `${s}:${ch?.verses ?? 1}`; }}>
							{#each chapters as ch (ch.id)}<option value={ch.id}>{ch.id}. {ch.name}</option>{/each}
						</select>
						<select aria-label="End verse" class="select select-bordered w-24" value={rangeEndAyah} onchange={(e) => { rangeEnd = `${rangeEndSurah}:${(e.target as HTMLSelectElement).value}`; }}>
							{#each verseOptions(rangeEndSurah) as v (v)}<option value={v}>{v}</option>{/each}
						</select>
					</div>
				</div>
			</div>
		{/if}

		<!-- Duration (continuous goals) -->
		{#if period === 'continuous'}
			<div>
				<label for="durationEl" class="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-2 block">Duration</label>
				<div class="flex items-center gap-3">
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (durationDays = Math.max(1, durationDays - 1))}>-</button>
					<div class="flex items-center gap-1">
						<input id="durationEl" type="number" min="1" max="3650" bind:value={durationDays} class="input input-bordered w-20 text-center text-lg font-bold" />
						<span class="text-sm text-base-content/50">days</span>
					</div>
					<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (durationDays = Math.min(3650, durationDays + 1))}>+</button>
				</div>
				<div class="flex gap-2 mt-3 flex-wrap">
					{#each DURATION_PRESETS as p (p.days)}
						<button type="button" class="btn btn-xs rounded-full {durationDays === p.days ? 'btn-primary' : 'btn-ghost border border-base-300'}" onclick={() => (durationDays = p.days)}>{p.label}</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if form?.error}
			<p class="text-sm text-error">{form.error}</p>
		{/if}

		<div class="flex gap-2">
			{#if showEdit}
				<button type="button" class="btn btn-ghost flex-1" onclick={() => (showEdit = false)}>Cancel</button>
			{/if}
			<button type="submit" class="btn btn-primary flex-1" disabled={saving}>
				{saving ? 'Saving...' : showEdit ? 'Update goal' : 'Start journey'}
			</button>
		</div>
	</form>

{:else if data.goal}
	<!-- ── PROGRESS ── -->

	<!-- Streak + week heatmap -->
	<div class="card bg-base-200 rounded-2xl p-5">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-3">
				<div class="text-3xl" aria-hidden="true">📖</div>
				<div>
					<div class="text-3xl font-bold text-base-content leading-none">{streakDays}</div>
					<div class="text-sm text-base-content/50">day streak</div>
				</div>
			</div>
			<div class="text-xs text-base-content/40">This week</div>
		</div>
		<div class="flex gap-1 justify-between">
			{#each data.weekData as day (day.date)}
				<div class="flex flex-col items-center gap-1 flex-1">
					<div class="w-full aspect-square rounded-lg max-w-9 {day.hasRead ? 'bg-primary' : day.isFuture ? 'bg-base-300/40' : 'bg-base-300'}" title={day.hasRead ? 'Read' : day.isFuture ? 'Upcoming' : 'Missed'}></div>
					<span class="text-[10px] {day.isToday ? 'font-bold text-base-content' : 'text-base-content/40'}">{day.dayName}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Daily progress -->
	{#if todayProgress}
		<div class="card bg-base-200 rounded-2xl p-5">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-semibold">Today's progress</h2>
				{#if isComplete}<span class="badge badge-success badge-sm">Complete</span>{/if}
			</div>
			<div class="flex items-end gap-2 mb-3">
				<span class="text-4xl font-bold text-base-content">{todayProgress.done}</span>
				<span class="text-base-content/40 mb-1">/ {todayProgress.target} {todayProgress.unit}</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-3">
				<div class="h-3 rounded-full transition-all {isComplete ? 'bg-success' : 'bg-primary'}" style="width: {todayProgress.percent}%"></div>
			</div>
			<p class="text-xs text-base-content/40 mt-2">
				{#if isComplete}Goal complete for today.
				{:else if todayProgress.unit === 'min'}~{todayProgress.target - todayProgress.done} min remaining
				{:else}{(todayProgress.target - todayProgress.done).toFixed(1)} {todayProgress.unit} remaining{/if}
			</p>
			<a href="/" class="btn btn-primary btn-sm mt-4 w-full">Continue reading</a>
		</div>
	{/if}

	<!-- Range progress -->
	{#if data.goal.type === 'range' && data.goal.rangeStart && data.goal.rangeEnd}
		<div class="card bg-base-200 rounded-2xl p-5">
			<h2 class="font-semibold mb-2">Range progress</h2>
			<div class="text-sm text-base-content/60 mb-3">{verseLabel(data.goal.rangeStart)} → {verseLabel(data.goal.rangeEnd)}</div>
			{#if data.rangeProgress}
				<div class="text-3xl font-bold mb-1">{data.rangeProgress.done} <span class="text-base font-normal text-base-content/40">verses read</span></div>
			{/if}
			<a href={`/${data.goal.rangeStart.split(':')[0]}#${data.goal.rangeStart}`} class="btn btn-primary btn-sm mt-3 w-full">Continue reading</a>
		</div>
	{/if}

	<!-- Duration progress -->
	{#if data.durationProgress && data.goal.period === 'continuous'}
		<div class="card bg-base-200 rounded-2xl p-5">
			<div class="flex items-center justify-between mb-2">
				<h2 class="font-semibold">Time progress</h2>
				<span class="text-sm text-base-content/50">Day {data.durationProgress.elapsed} of {data.durationProgress.total}</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-2.5">
				<div class="h-2.5 rounded-full bg-secondary transition-all" style="width: {data.durationProgress.percent}%"></div>
			</div>
			<p class="text-xs text-base-content/40 mt-2">{Math.max(0, data.durationProgress.total - data.durationProgress.elapsed)} days remaining</p>
		</div>
	{/if}

	<!-- Goal summary + actions -->
	<div class="card bg-base-200 rounded-2xl p-5">
		<div class="flex items-center justify-between mb-3">
			<h2 class="font-semibold">Current goal</h2>
			<button class="btn btn-xs btn-ghost" onclick={startEdit}>Edit</button>
		</div>
		<div class="text-sm text-base-content/60 flex flex-col gap-1">
			{#if data.goal.type === 'pages'}
				<span><span class="font-medium text-base-content">{data.goal.dailyPages} pages/day</span> · {data.goal.period === 'daily' ? 'Daily goal' : 'Over a duration'}</span>
			{:else if data.goal.type === 'time'}
				<span><span class="font-medium text-base-content">{Math.round((data.goal.dailySeconds ?? 0) / 60)} min/day</span> · {data.goal.period === 'daily' ? 'Daily goal' : 'Over a duration'}</span>
			{:else}
				<span>Range: <span class="font-medium text-base-content">{verseLabel(data.goal.rangeStart)} – {verseLabel(data.goal.rangeEnd)}</span></span>
				{#if data.goal.duration}<span>Over a duration: <span class="font-medium text-base-content">{data.goal.duration} days</span></span>{/if}
			{/if}
		</div>
		<div class="text-xs text-base-content/30 mt-2">
			Started {new Date(data.goal.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
		</div>
		<form method="POST" action="?/delete" use:enhance={() => { deleting = true; return async ({ update }) => { await update(); deleting = false; }; }} class="mt-4">
			<button type="submit" class="btn btn-error btn-outline btn-sm w-full" disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete goal'}
			</button>
		</form>
	</div>

{/if}

</div>
