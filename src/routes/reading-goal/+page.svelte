<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	// ── Wizard state ──
	type Step = 'presets' | 'type' | 'period' | 'amount';
	type GoalType = 'time' | 'pages' | 'range';
	type Period = 'daily' | 'continuous';

	let step = $state<Step>('presets');
	let goalType = $state<GoalType>('pages');
	let period = $state<Period>('daily');

	// Amount inputs
	let dailyPagesInput = $state(1);
	let dailyMinutes = $state(10);
	let durationDays = $state(30);
	let rangeStart = $state('1:1');
	let rangeEnd = $state('114:6');

	let saving = $state(false);
	let deleting = $state(false);
	let showEdit = $state(false);

	const dailySeconds = $derived(dailyMinutes * 60);

	// Chapter data
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

	// ── Preset examples ──
	const PRESETS = [
		{
			key: '10_mins',
			label: '10 minutes a day',
			desc: 'A gentle daily habit',
			icon: '⏱',
			values: { goalType: 'time' as GoalType, period: 'daily' as Period, dailyMinutes: 10 }
		},
		{
			key: 'khatm_30',
			label: 'Khatm in 30 days',
			desc: 'Full Quran in one month',
			icon: '📖',
			values: {
				goalType: 'range' as GoalType,
				period: 'continuous' as Period,
				durationDays: 30,
				rangeStart: '1:1',
				rangeEnd: '114:6'
			}
		},
		{
			key: 'yearly',
			label: 'Quran in a year',
			desc: 'Full Quran in 365 days',
			icon: '📅',
			values: {
				goalType: 'range' as GoalType,
				period: 'continuous' as Period,
				durationDays: 365,
				rangeStart: '1:1',
				rangeEnd: '114:6'
			}
		},
		{
			key: 'custom',
			label: 'Custom goal',
			desc: 'Build your own',
			icon: '⚙️',
			values: null
		}
	] as const;

	function applyPreset(key: (typeof PRESETS)[number]['key']) {
		const preset = PRESETS.find((p) => p.key === key)!;
		if (!preset.values) {
			step = 'type';
			return;
		}
		const v = preset.values;
		goalType = v.goalType;
		period = v.period;
		if ('dailyMinutes' in v) dailyMinutes = v.dailyMinutes;
		if ('durationDays' in v) durationDays = v.durationDays;
		if ('rangeStart' in v) rangeStart = v.rangeStart;
		if ('rangeEnd' in v) rangeEnd = v.rangeEnd;
		step = 'amount';
	}

	function goBack() {
		if (step === 'amount') step = period === 'daily' ? 'period' : 'period';
		else if (step === 'period') step = 'type';
		else if (step === 'type') step = 'presets';
	}

	function selectType(t: GoalType) {
		goalType = t;
		// range is always continuous
		if (t === 'range') {
			period = 'continuous';
			step = 'amount';
		} else {
			step = 'period';
		}
	}

	function selectPeriod(p: Period) {
		period = p;
		step = 'amount';
	}

	// Range selectors
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

	// Duration presets
	const DURATION_PRESETS = [
		{ days: 7, label: '1 week' },
		{ days: 30, label: '30 days' },
		{ days: 90, label: '3 months' },
		{ days: 180, label: '6 months' },
		{ days: 365, label: '1 year' }
	];

	// Progress helpers
	const streakDays = $derived(data.streak ?? 0);
	const todayProgress = $derived(data.todayProgress);
	const isComplete = $derived(todayProgress?.isComplete ?? false);

	// Edit: populate form from existing goal
	function startEdit() {
		if (data.goal) {
			goalType = data.goal.type;
			period = data.goal.period ?? 'daily';
			dailyPagesInput = data.goal.dailyPages ?? 1;
			dailyMinutes = Math.round((data.goal.dailySeconds ?? 600) / 60);
			durationDays = data.goal.duration ?? 30;
			rangeStart = data.goal.rangeStart ?? '1:1';
			rangeEnd = data.goal.rangeEnd ?? '114:6';
			step = 'amount';
		}
		showEdit = true;
	}

	// Wizard progress indicator
	const WIZARD_STEPS: Step[] = ['presets', 'type', 'period', 'amount'];
	const stepIdx = $derived(WIZARD_STEPS.indexOf(step));
	const stepPercent = $derived(((stepIdx + 1) / WIZARD_STEPS.length) * 100);
</script>

<svelte:head>
	<title>Reading Goal</title>
</svelte:head>

<div class="sticky top-[3.5rem] z-20 bg-base-100 border-b border-base-200">
	<div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
		{#if !data.goal || showEdit}
			<button
				type="button"
				aria-label="Back"
				class="btn btn-ghost btn-sm btn-circle"
				onclick={() => {
					if (showEdit) { showEdit = false; step = 'presets'; }
					else if (step !== 'presets') goBack();
					else history.back();
				}}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
				</svg>
			</button>
		{:else}
			<a href="/" aria-label="Back" class="btn btn-ghost btn-sm btn-circle">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
				</svg>
			</a>
		{/if}
		<h1 class="text-base font-semibold text-base-content">Reading Goal</h1>
	</div>
	{#if !data.goal || showEdit}
		<!-- Wizard progress bar -->
		<div class="h-0.5 bg-base-200">
			<div class="h-full bg-primary transition-all duration-300" style="width: {stepPercent}%"></div>
		</div>
	{/if}
</div>

<div class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

{#if !data.goal || showEdit}
	<!-- ── SETUP WIZARD ── -->
	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
				showEdit = false;
				step = 'presets';
			};
		}}
	>
		<!-- Hidden fields always submitted -->
		<input type="hidden" name="type" value={goalType} />
		<input type="hidden" name="period" value={period} />
		<input type="hidden" name="dailyPages" value={dailyPagesInput} />
		<input type="hidden" name="dailySeconds" value={dailySeconds} />
		<input type="hidden" name="duration" value={durationDays} />
		<input type="hidden" name="rangeStart" value={rangeStart} />
		<input type="hidden" name="rangeEnd" value={rangeEnd} />

		{#if step === 'presets'}
			<!-- Step 1: Preset examples -->
			<div class="flex flex-col gap-3">
				<div class="mb-2">
					<h2 class="text-xl font-bold">Choose your goal</h2>
					<p class="text-sm text-base-content/50 mt-1">Pick a preset or build your own.</p>
				</div>
				{#each PRESETS as preset (preset.key)}
					<button
						type="button"
						class="flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all bg-base-200 border-transparent hover:border-primary/40 hover:bg-base-200"
						onclick={() => applyPreset(preset.key)}
					>
						<div class="text-3xl shrink-0" aria-hidden="true">{preset.icon}</div>
						<div>
							<div class="font-semibold text-base-content">{preset.label}</div>
							<div class="text-sm text-base-content/50">{preset.desc}</div>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="ml-auto text-base-content/30 shrink-0">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
						</svg>
					</button>
				{/each}
			</div>

		{:else if step === 'type'}
			<!-- Step 2: Goal type -->
			<div class="flex flex-col gap-3">
				<div class="mb-2">
					<h2 class="text-xl font-bold">Goal type</h2>
					<p class="text-sm text-base-content/50 mt-1">What do you want to track?</p>
				</div>

				{#each [
					{ t: 'time' as GoalType, icon: '⏱', label: 'Time', desc: 'Minutes of reading per day' },
					{ t: 'pages' as GoalType, icon: '📄', label: 'Pages', desc: 'Quran pages per day' },
					{ t: 'range' as GoalType, icon: '🎯', label: 'Custom range', desc: 'Specific verses over a period' }
				] as opt (opt.t)}
					<button
						type="button"
						class="flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all {goalType === opt.t ? 'border-primary bg-primary/5' : 'bg-base-200 border-transparent hover:border-primary/40'}"
						onclick={() => selectType(opt.t)}
					>
						<div class="text-2xl shrink-0" aria-hidden="true">{opt.icon}</div>
						<div>
							<div class="font-semibold text-base-content">{opt.label}</div>
							<div class="text-sm text-base-content/50">{opt.desc}</div>
						</div>
					</button>
				{/each}
			</div>

		{:else if step === 'period'}
			<!-- Step 3: Daily or Continuous -->
			<div class="flex flex-col gap-3">
				<div class="mb-2">
					<h2 class="text-xl font-bold">Frequency</h2>
					<p class="text-sm text-base-content/50 mt-1">How often do you want to track?</p>
				</div>

				<button
					type="button"
					class="flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all {period === 'daily' ? 'border-primary bg-primary/5' : 'bg-base-200 border-transparent hover:border-primary/40'}"
					onclick={() => selectPeriod('daily')}
				>
					<div class="text-2xl shrink-0" aria-hidden="true">🔁</div>
					<div>
						<div class="font-semibold text-base-content">Daily</div>
						<div class="text-sm text-base-content/50">Repeat every day</div>
					</div>
				</button>

				<button
					type="button"
					class="flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all {period === 'continuous' ? 'border-primary bg-primary/5' : 'bg-base-200 border-transparent hover:border-primary/40'}"
					onclick={() => selectPeriod('continuous')}
				>
					<div class="text-2xl shrink-0" aria-hidden="true">📅</div>
					<div>
						<div class="font-semibold text-base-content">Continuous</div>
						<div class="text-sm text-base-content/50">Finish a target over a set number of days</div>
					</div>
				</button>
			</div>

		{:else if step === 'amount'}
			<!-- Step 4: Set amount -->
			<div class="flex flex-col gap-5">
				<div class="mb-1">
					<h2 class="text-xl font-bold">
						{#if goalType === 'time'}How many minutes a day?
						{:else if goalType === 'pages'}How many pages a day?
						{:else}Which verses?
						{/if}
					</h2>
					<p class="text-sm text-base-content/50 mt-1">
						{#if period === 'continuous'}You'll also set a total duration.{/if}
					</p>
				</div>

				{#if goalType === 'time'}
					<div class="card bg-base-200 rounded-2xl p-5">
						<label for="dailyMinsInput" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-3 block">Minutes per day</label>
						<div class="flex items-center gap-4">
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (dailyMinutes = Math.max(1, dailyMinutes - 1))}>-</button>
							<input
								id="dailyMinsInput"
								type="number"
								min="1"
								max="480"
								bind:value={dailyMinutes}
								class="input input-bordered w-24 text-center text-xl font-bold"
							/>
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (dailyMinutes = Math.min(480, dailyMinutes + 1))}>+</button>
						</div>
						<div class="flex gap-2 mt-4 flex-wrap">
							{#each [5, 10, 15, 20, 30] as preset (preset)}
								<button
									type="button"
									class="btn btn-xs rounded-full {dailyMinutes === preset ? 'btn-primary' : 'btn-ghost border border-base-300'}"
									onclick={() => (dailyMinutes = preset)}
								>{preset} min</button>
							{/each}
						</div>
					</div>

				{:else if goalType === 'pages'}
					<div class="card bg-base-200 rounded-2xl p-5">
						<label for="dailyPagesInput" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-3 block">Pages per day</label>
						<div class="flex items-center gap-4">
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (dailyPagesInput = Math.max(1, dailyPagesInput - 1))}>-</button>
							<input
								id="dailyPagesInput"
								type="number"
								min="1"
								max="604"
								bind:value={dailyPagesInput}
								class="input input-bordered w-24 text-center text-xl font-bold"
							/>
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (dailyPagesInput = Math.min(604, dailyPagesInput + 1))}>+</button>
						</div>
						<p class="text-xs text-base-content/40 mt-3">
							{dailyPagesInput} pages/day = full Quran in ~{Math.round(604 / dailyPagesInput)} days
						</p>
						<div class="flex gap-2 mt-3 flex-wrap">
							{#each [1, 2, 4, 8] as preset (preset)}
								<button
									type="button"
									class="btn btn-xs rounded-full {dailyPagesInput === preset ? 'btn-primary' : 'btn-ghost border border-base-300'}"
									onclick={() => (dailyPagesInput = preset)}
								>{preset} {preset === 1 ? 'page' : 'pages'}/day</button>
							{/each}
						</div>
					</div>

				{:else}
					<!-- Range selectors -->
					<div class="card bg-base-200 rounded-2xl p-5 flex flex-col gap-4">
						<div>
							<label for="rsStartSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">From</label>
							<div class="flex gap-2">
								<select
									id="rsStartSurah"
									class="select select-bordered flex-1"
									value={rangeStartSurah}
									onchange={(e) => { const s = Number((e.target as HTMLSelectElement).value); rangeStart = `${s}:1`; }}
								>
									{#each chapters as ch (ch.id)}
										<option value={ch.id}>{ch.id}. {ch.name}</option>
									{/each}
								</select>
								<select
									aria-label="Start verse"
									class="select select-bordered w-24"
									value={rangeStartAyah}
									onchange={(e) => { rangeStart = `${rangeStartSurah}:${(e.target as HTMLSelectElement).value}`; }}
								>
									{#each verseOptions(rangeStartSurah) as v (v)}
										<option value={v}>{v}</option>
									{/each}
								</select>
							</div>
						</div>
						<div>
							<label for="rsEndSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">To</label>
							<div class="flex gap-2">
								<select
									id="rsEndSurah"
									class="select select-bordered flex-1"
									value={rangeEndSurah}
									onchange={(e) => { const s = Number((e.target as HTMLSelectElement).value); const ch = chapters.find(c => c.id === s); rangeEnd = `${s}:${ch?.verses ?? 1}`; }}
								>
									{#each chapters as ch (ch.id)}
										<option value={ch.id}>{ch.id}. {ch.name}</option>
									{/each}
								</select>
								<select
									aria-label="End verse"
									class="select select-bordered w-24"
									value={rangeEndAyah}
									onchange={(e) => { rangeEnd = `${rangeEndSurah}:${(e.target as HTMLSelectElement).value}`; }}
								>
									{#each verseOptions(rangeEndSurah) as v (v)}
										<option value={v}>{v}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>
				{/if}

				<!-- Duration (for continuous) -->
				{#if period === 'continuous'}
					<div class="card bg-base-200 rounded-2xl p-5">
						<label for="durationInput" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-3 block">Duration (days)</label>
						<div class="flex items-center gap-4">
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Decrease" onclick={() => (durationDays = Math.max(1, durationDays - 1))}>-</button>
							<input
								id="durationInput"
								type="number"
								min="1"
								max="3650"
								bind:value={durationDays}
								class="input input-bordered w-24 text-center text-xl font-bold"
							/>
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" aria-label="Increase" onclick={() => (durationDays = Math.min(3650, durationDays + 1))}>+</button>
						</div>
						<div class="flex gap-2 mt-4 flex-wrap">
							{#each DURATION_PRESETS as p (p.days)}
								<button
									type="button"
									class="btn btn-xs rounded-full {durationDays === p.days ? 'btn-primary' : 'btn-ghost border border-base-300'}"
									onclick={() => (durationDays = p.days)}
								>{p.label}</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if form?.error}
					<p class="text-sm text-error">{form.error}</p>
				{/if}

				<button type="submit" class="btn btn-primary w-full" disabled={saving}>
					{saving ? 'Saving...' : showEdit ? 'Update goal' : 'Start journey'}
				</button>
			</div>
		{/if}
	</form>

{:else if data.goal}
	<!-- ── PROGRESS DASHBOARD ── -->

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
					<div
						class="w-full aspect-square rounded-lg max-w-9 {day.hasRead ? 'bg-primary' : day.isFuture ? 'bg-base-300/40' : 'bg-base-300'}"
						title={day.hasRead ? 'Read' : day.isFuture ? 'Upcoming' : 'Missed'}
					></div>
					<span class="text-[10px] {day.isToday ? 'font-bold text-base-content' : 'text-base-content/40'}">
						{day.dayName}
					</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Daily progress (time / pages goal, daily period) -->
	{#if todayProgress}
		<div class="card bg-base-200 rounded-2xl p-5">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-semibold">Today's progress</h2>
				{#if isComplete}
					<span class="badge badge-success badge-sm">Complete ✓</span>
				{/if}
			</div>
			<div class="flex items-end gap-2 mb-3">
				<span class="text-4xl font-bold text-base-content">{todayProgress.done}</span>
				<span class="text-base-content/40 mb-1">/ {todayProgress.target} {todayProgress.unit}</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-3">
				<div
					class="h-3 rounded-full transition-all {isComplete ? 'bg-success' : 'bg-primary'}"
					style="width: {todayProgress.percent}%"
				></div>
			</div>
			<p class="text-xs text-base-content/40 mt-2">
				{#if isComplete}
					Goal complete for today.
				{:else if todayProgress.unit === 'min'}
					~{todayProgress.target - todayProgress.done} min remaining
				{:else}
					{(todayProgress.target - todayProgress.done).toFixed(1)} {todayProgress.unit} remaining
				{/if}
			</p>
			<a href="/" class="btn btn-primary btn-sm mt-4 w-full">Continue reading</a>
		</div>
	{/if}

	<!-- Range / continuous progress -->
	{#if data.goal.type === 'range' && data.goal.rangeStart && data.goal.rangeEnd}
		<div class="card bg-base-200 rounded-2xl p-5">
			<h2 class="font-semibold mb-2">Range progress</h2>
			<div class="text-sm text-base-content/60 mb-3">
				{verseLabel(data.goal.rangeStart)} → {verseLabel(data.goal.rangeEnd)}
			</div>
			{#if data.rangeProgress}
				<div class="text-3xl font-bold mb-1">
					{data.rangeProgress.done}
					<span class="text-base font-normal text-base-content/40">verses read</span>
				</div>
			{/if}
			<a href={`/${data.goal.rangeStart.split(':')[0]}#${data.goal.rangeStart}`} class="btn btn-primary btn-sm mt-3 w-full">
				Continue reading
			</a>
		</div>
	{/if}

	<!-- Duration progress (continuous goals) -->
	{#if data.durationProgress && data.goal.period === 'continuous'}
		<div class="card bg-base-200 rounded-2xl p-5">
			<h2 class="font-semibold mb-3">Time progress</h2>
			<div class="flex justify-between text-sm text-base-content/60 mb-2">
				<span>Day {data.durationProgress.elapsed} of {data.durationProgress.total}</span>
				<span>{data.durationProgress.percent}%</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-2.5">
				<div
					class="h-2.5 rounded-full bg-secondary transition-all"
					style="width: {data.durationProgress.percent}%"
				></div>
			</div>
			<p class="text-xs text-base-content/40 mt-2">
				{Math.max(0, data.durationProgress.total - data.durationProgress.elapsed)} days remaining
			</p>
		</div>
	{/if}

	<!-- Goal details + actions -->
	<div class="card bg-base-200 rounded-2xl p-5">
		<div class="flex items-center justify-between mb-3">
			<h2 class="font-semibold">Current goal</h2>
			<button class="btn btn-xs btn-ghost" onclick={startEdit}>Edit</button>
		</div>
		<div class="text-sm text-base-content/60 flex flex-col gap-1">
			{#if data.goal.type === 'pages'}
				<span><span class="font-medium text-base-content">{data.goal.dailyPages} pages/day</span> · Daily</span>
			{:else if data.goal.type === 'time'}
				<span><span class="font-medium text-base-content">{Math.round((data.goal.dailySeconds ?? 0) / 60)} min/day</span> · Daily</span>
			{:else}
				<span>Range: <span class="font-medium text-base-content">{verseLabel(data.goal.rangeStart)} – {verseLabel(data.goal.rangeEnd)}</span></span>
				{#if data.goal.duration}
					<span>Duration: <span class="font-medium text-base-content">{data.goal.duration} days</span></span>
				{/if}
			{/if}
		</div>
		<div class="text-xs text-base-content/30 mt-2">
			Started {new Date(data.goal.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
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
			<button type="submit" class="btn btn-error btn-outline btn-sm w-full" disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete goal'}
			</button>
		</form>
	</div>

{/if}

</div>
