<script lang="ts">
	type GoalType = 'time' | 'pages' | 'range';
	type Period = 'daily' | 'continuous';

	let {
		goalType = $bindable<GoalType>('pages'),
		period = $bindable<Period>('daily'),
		dailyPagesInput = $bindable(1),
		dailyMinutes = $bindable(10),
		durationDays = $bindable(30),
		targetDate = $bindable(''),
		rangeStart = $bindable('1:1'),
		rangeEnd = $bindable('114:6'),
		chapters = []
	}: {
		goalType: GoalType;
		period: Period;
		dailyPagesInput: number;
		dailyMinutes: number;
		durationDays: number;
		targetDate: string;
		rangeStart: string;
		rangeEnd: string;
		chapters: { id: number; name: string; verses: number }[];
	} = $props();

	const dailySeconds = $derived(dailyMinutes * 60);

	let rangeStartSurah = $derived(Number(rangeStart.split(':')[0]) || 1);
	let rangeStartAyah = $derived(Number(rangeStart.split(':')[1]) || 1);
	let rangeEndSurah = $derived(Number(rangeEnd.split(':')[0]) || 114);
	let rangeEndAyah = $derived(Number(rangeEnd.split(':')[1]) || 6);

	function todayStr() {
		return new Date().toISOString().slice(0, 10);
	}

	function onDatePick(dateStr: string) {
		targetDate = dateStr;
		if (!dateStr) return;
		const diff = Math.round(
			(new Date(dateStr).getTime() - new Date(todayStr()).getTime()) / 86400000
		);
		if (diff >= 1) durationDays = diff;
	}

	function onDaysStepper(days: number) {
		durationDays = days;
		const d = new Date();
		d.setDate(d.getDate() + days);
		targetDate = d.toISOString().slice(0, 10);
	}

	function verseOptions(chapterId: number) {
		const ch = chapters.find((c) => c.id === chapterId);
		if (!ch) return [];
		return Array.from({ length: ch.verses }, (_, i) => i + 1);
	}

	const DURATION_PRESETS = [
		{ days: 7, label: '1 week' },
		{ days: 30, label: '30 days' },
		{ days: 90, label: '3 months' },
		{ days: 180, label: '6 months' },
		{ days: 365, label: '1 year' }
	];
</script>

<!-- Hidden inputs for form submission -->
<input type="hidden" name="type" value={goalType} />
<input type="hidden" name="period" value={period} />
<input type="hidden" name="dailyPages" value={dailyPagesInput} />
<input type="hidden" name="dailySeconds" value={dailySeconds} />
<input type="hidden" name="duration" value={durationDays} />
<input type="hidden" name="rangeStart" value={rangeStart} />
<input type="hidden" name="rangeEnd" value={rangeEnd} />

<!-- Goal type -->
<fieldset>
	<legend class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
		>Goal type</legend
	>
	<div class="flex gap-2">
		{#each [{ t: 'time' as GoalType, label: 'Time' }, { t: 'pages' as GoalType, label: 'Pages' }, { t: 'range' as GoalType, label: 'Range' }] as opt (opt.t)}
			<button
				type="button"
				class="flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all {goalType ===
				opt.t
					? 'border-primary bg-primary/10 text-primary'
					: 'border-base-300 text-base-content/60 hover:border-base-content/20'}"
				onclick={() => {
					goalType = opt.t;
					if (opt.t === 'range') period = 'continuous';
				}}
			>
				{opt.label}
			</button>
		{/each}
	</div>
</fieldset>

<!-- Period (hidden for range — always continuous) -->
{#if goalType !== 'range'}
	<fieldset>
		<legend class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
			>Frequency</legend
		>
		<div class="flex flex-col gap-2 sm:flex-row">
			<button
				type="button"
				class="flex flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all {period ===
				'daily'
					? 'border-primary bg-primary/10'
					: 'border-base-300 hover:border-base-content/20'}"
				onclick={() => (period = 'daily')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					class="mt-0.5 shrink-0 {period === 'daily' ? 'text-primary' : 'text-base-content/40'}"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				<div>
					<div
						class="text-sm font-semibold {period === 'daily' ? 'text-primary' : 'text-base-content'}"
					>
						Daily goal
					</div>
					<div class="mt-0.5 text-xs text-base-content/50">Your goal will reset every day</div>
				</div>
			</button>
			<button
				type="button"
				class="flex flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all {period ===
				'continuous'
					? 'border-primary bg-primary/10'
					: 'border-base-300 hover:border-base-content/20'}"
				onclick={() => (period = 'continuous')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					class="mt-0.5 shrink-0 {period === 'continuous'
						? 'text-primary'
						: 'text-base-content/40'}"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<div>
					<div
						class="text-sm font-semibold {period === 'continuous'
							? 'text-primary'
							: 'text-base-content'}"
					>
						Over a duration
					</div>
					<div class="mt-0.5 text-xs text-base-content/50">
						Progress calculated over a number of days
					</div>
				</div>
			</button>
		</div>
	</fieldset>
{/if}

<!-- Amount -->
{#if goalType === 'time'}
	<div>
		<label
			for="gf-dailyMins"
			class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
			>Minutes per day</label
		>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Decrease"
				onclick={() => (dailyMinutes = Math.max(1, dailyMinutes - 1))}>-</button
			>
			<input
				id="gf-dailyMins"
				type="number"
				min="1"
				max="480"
				bind:value={dailyMinutes}
				class="input input-bordered w-24 text-center text-lg font-bold"
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Increase"
				onclick={() => (dailyMinutes = Math.min(480, dailyMinutes + 1))}>+</button
			>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each [5, 10, 20, 30, 60] as p (p)}
				<button
					type="button"
					class="btn btn-xs rounded-full {dailyMinutes === p
						? 'btn-primary'
						: 'btn-ghost border border-base-300'}"
					onclick={() => (dailyMinutes = p)}>{p} min</button
				>
			{/each}
		</div>
	</div>
{:else if goalType === 'pages'}
	<div>
		<label
			for="gf-dailyPages"
			class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
			>Pages per day</label
		>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Decrease"
				onclick={() => (dailyPagesInput = Math.max(1, dailyPagesInput - 1))}>-</button
			>
			<input
				id="gf-dailyPages"
				type="number"
				min="1"
				max="604"
				bind:value={dailyPagesInput}
				class="input input-bordered w-24 text-center text-lg font-bold"
			/>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Increase"
				onclick={() => (dailyPagesInput = Math.min(604, dailyPagesInput + 1))}>+</button
			>
		</div>
		<p class="mt-2 text-xs text-base-content/40">
			{dailyPagesInput} pages/day = full Quran in ~{Math.round(604 / dailyPagesInput)} days
		</p>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each [1, 5, 10, 20] as p (p)}
				<button
					type="button"
					class="btn btn-xs rounded-full {dailyPagesInput === p
						? 'btn-primary'
						: 'btn-ghost border border-base-300'}"
					onclick={() => (dailyPagesInput = p)}>{p} {p === 1 ? 'page' : 'pages'}/day</button
				>
			{/each}
		</div>
	</div>
{:else}
	<!-- Range -->
	<div class="flex flex-col gap-3">
		<div>
			<label
				for="gf-startSurah"
				class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
				>From</label
			>
			<div class="flex gap-2">
				<select
					id="gf-startSurah"
					class="select select-bordered flex-1"
					value={rangeStartSurah}
					onchange={(e) => {
						const s = Number((e.target as HTMLSelectElement).value);
						rangeStart = `${s}:1`;
					}}
				>
					{#each chapters as ch (ch.id)}<option value={ch.id}>{ch.id}. {ch.name}</option>{/each}
				</select>
				<select
					aria-label="Start verse"
					class="select select-bordered w-24"
					value={rangeStartAyah}
					onchange={(e) => {
						rangeStart = `${rangeStartSurah}:${(e.target as HTMLSelectElement).value}`;
					}}
				>
					{#each verseOptions(rangeStartSurah) as v (v)}<option value={v}>{v}</option>{/each}
				</select>
			</div>
		</div>
		<div>
			<label
				for="gf-endSurah"
				class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
				>To</label
			>
			<div class="flex gap-2">
				<select
					id="gf-endSurah"
					class="select select-bordered flex-1"
					value={rangeEndSurah}
					onchange={(e) => {
						const s = Number((e.target as HTMLSelectElement).value);
						const ch = chapters.find((c) => c.id === s);
						rangeEnd = `${s}:${ch?.verses ?? 1}`;
					}}
				>
					{#each chapters as ch (ch.id)}<option value={ch.id}>{ch.id}. {ch.name}</option>{/each}
				</select>
				<select
					aria-label="End verse"
					class="select select-bordered w-24"
					value={rangeEndAyah}
					onchange={(e) => {
						rangeEnd = `${rangeEndSurah}:${(e.target as HTMLSelectElement).value}`;
					}}
				>
					{#each verseOptions(rangeEndSurah) as v (v)}<option value={v}>{v}</option>{/each}
				</select>
			</div>
		</div>
	</div>
{/if}

<!-- Duration (continuous goals) -->
{#if period === 'continuous'}
	<div>
		<p class="mb-2 text-xs font-semibold tracking-wide text-base-content/40 uppercase">
			Duration
		</p>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Decrease"
				onclick={() => onDaysStepper(Math.max(1, durationDays - 1))}>-</button
			>
			<div class="flex items-center gap-1">
				<input
					type="number"
					min="1"
					max="3650"
					value={durationDays}
					oninput={(e) =>
						onDaysStepper(
							Math.max(1, Math.min(3650, Number((e.target as HTMLInputElement).value) || 1))
						)}
					class="input input-bordered w-20 text-center text-lg font-bold"
				/>
				<span class="text-sm text-base-content/50">days</span>
			</div>
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm border border-base-300"
				aria-label="Increase"
				onclick={() => onDaysStepper(Math.min(3650, durationDays + 1))}>+</button
			>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each DURATION_PRESETS as p (p.days)}
				<button
					type="button"
					class="btn btn-xs rounded-full {durationDays === p.days
						? 'btn-primary'
						: 'btn-ghost border border-base-300'}"
					onclick={() => onDaysStepper(p.days)}>{p.label}</button
				>
			{/each}
		</div>
		<div class="mt-4">
			<label
				for="gf-endDate"
				class="mb-2 block text-xs font-semibold tracking-wide text-base-content/40 uppercase"
				>Or pick an end date</label
			>
			<input
				id="gf-endDate"
				type="date"
				lang="en-GB"
				min={todayStr()}
				value={targetDate}
				onchange={(e) => onDatePick((e.target as HTMLInputElement).value)}
				class="input input-bordered w-full"
			/>
			<div class="mt-2 flex flex-wrap gap-2">
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-full border border-base-300"
					onclick={() => onDatePick('2026-06-16')}>Next Hijri year</button
				>
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-full border border-base-300"
					onclick={() => onDatePick('2027-02-07')}>Before Ramadan 2027</button
				>
			</div>
			{#if targetDate}
				<p class="mt-1 text-xs text-base-content/60">
					{new Date(targetDate).toLocaleDateString('en-GB', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric'
					})} &middot; {durationDays} days from today
				</p>
			{/if}
		</div>
	</div>
{/if}
