<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form } = $props<{ data: any; form: any }>();

	type GoalType = 'daily_verses' | 'range';
	let goalType = $state<GoalType>('daily_verses');
	let dailyTarget = $state(5);
	let rangeStart = $state('1:1');
	let rangeEnd = $state('2:286');
	let saving = $state(false);
	let deleting = $state(false);
	let showEdit = $state(false);

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

	function verseLabel(verseKey: string) {
		const [s, a] = verseKey.split(':');
		const ch = chapters.find((c) => c.id === Number(s));
		return ch ? `${ch.name} ${s}:${a}` : `${s}:${a}`;
	}

	const streakDays = $derived(data.streak ?? 0);
	const todayCount = $derived(data.todayCount ?? 0);
	const dailyGoalTarget = $derived(data.goal?.dailyTarget ?? 0);
	const todayPercent = $derived(
		dailyGoalTarget > 0 ? Math.min(100, Math.round((todayCount / dailyGoalTarget) * 100)) : 0
	);
	const isCompleted = $derived(dailyGoalTarget > 0 && todayCount >= dailyGoalTarget);

	function startEdit() {
		if (data.goal) {
			goalType = data.goal.type;
			dailyTarget = data.goal.dailyTarget ?? 5;
			rangeStart = data.goal.rangeStart ?? '1:1';
			rangeEnd = data.goal.rangeEnd ?? '2:286';
		}
		showEdit = true;
	}

	function verseOptions(chapterId: number) {
		const ch = chapters.find((c) => c.id === chapterId);
		if (!ch) return [];
		return Array.from({ length: ch.verses }, (_, i) => i + 1);
	}

	let rangeStartSurah = $derived(Number(rangeStart.split(':')[0]) || 1);
	let rangeStartAyah = $derived(Number(rangeStart.split(':')[1]) || 1);
	let rangeEndSurah = $derived(Number(rangeEnd.split(':')[0]) || 2);
	let rangeEndAyah = $derived(Number(rangeEnd.split(':')[1]) || 1);

	function setRangeStart(surah: number, ayah: number) {
		rangeStart = `${surah}:${ayah}`;
	}
	function setRangeEnd(surah: number, ayah: number) {
		rangeEnd = `${surah}:${ayah}`;
	}
</script>

<svelte:head>
	<title>Reading Goal</title>
</svelte:head>

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

{#if !data.goal}
	<!-- Setup form -->
	<div class="card bg-base-200 rounded-2xl p-6">
		<h2 class="text-lg font-bold mb-1">Set your reading goal</h2>
		<p class="text-sm text-base-content/50 mb-5">Track your Quran reading progress daily.</p>

		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
				};
			}}
			class="flex flex-col gap-5"
		>
			<fieldset>
				<legend class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">Goal type</legend>
				<div class="flex gap-2">
					<button
						type="button"
						class="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all {goalType === 'daily_verses' ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/60 hover:border-base-content/30'}"
						onclick={() => (goalType = 'daily_verses')}
					>
						<div class="text-lg mb-0.5" aria-hidden="true">📖</div>
						Daily verses
					</button>
					<button
						type="button"
						class="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all {goalType === 'range' ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/60 hover:border-base-content/30'}"
						onclick={() => (goalType = 'range')}
					>
						<div class="text-lg mb-0.5" aria-hidden="true">🎯</div>
						Verse range
					</button>
				</div>
				<input type="hidden" name="type" value={goalType} />
			</fieldset>

			{#if goalType === 'daily_verses'}
				<div>
					<label for="dailyTarget" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">
						Verses per day
					</label>
					<div class="flex items-center gap-3">
						<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" onclick={() => (dailyTarget = Math.max(1, dailyTarget - 1))} aria-label="Decrease">-</button>
						<input
							id="dailyTarget"
							type="number"
							name="dailyTarget"
							min="1"
							max="100"
							bind:value={dailyTarget}
							class="input input-bordered w-24 text-center text-lg font-bold"
						/>
						<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" onclick={() => (dailyTarget = Math.min(100, dailyTarget + 1))} aria-label="Increase">+</button>
					</div>
					<p class="text-xs text-base-content/40 mt-2">
						{dailyTarget} verses/day = full Quran in ~{Math.round(6236 / dailyTarget)} days
					</p>
					<div class="flex gap-2 mt-3 flex-wrap">
						{#each [5, 10, 20] as preset (preset)}
							<button
								type="button"
								class="btn btn-xs rounded-full {dailyTarget === preset ? 'btn-primary' : 'btn-ghost border border-base-300'}"
								onclick={() => (dailyTarget = preset)}
							>
								{preset}/day
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					<div>
						<label for="rangeStartSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">From</label>
						<div class="flex gap-2">
							<select
								id="rangeStartSurah"
								class="select select-bordered flex-1"
								value={rangeStartSurah}
								onchange={(e) => setRangeStart(Number((e.target as HTMLSelectElement).value), 1)}
							>
								{#each chapters as ch (ch.id)}
									<option value={ch.id}>{ch.id}. {ch.name}</option>
								{/each}
							</select>
							<select
								aria-label="Start verse"
								class="select select-bordered w-24"
								value={rangeStartAyah}
								onchange={(e) => setRangeStart(rangeStartSurah, Number((e.target as HTMLSelectElement).value))}
							>
								{#each verseOptions(rangeStartSurah) as v (v)}
									<option value={v}>{v}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label for="rangeEndSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">To</label>
						<div class="flex gap-2">
							<select
								id="rangeEndSurah"
								class="select select-bordered flex-1"
								value={rangeEndSurah}
								onchange={(e) => setRangeEnd(Number((e.target as HTMLSelectElement).value), 1)}
							>
								{#each chapters as ch (ch.id)}
									<option value={ch.id}>{ch.id}. {ch.name}</option>
								{/each}
							</select>
							<select
								aria-label="End verse"
								class="select select-bordered w-24"
								value={rangeEndAyah}
								onchange={(e) => setRangeEnd(rangeEndSurah, Number((e.target as HTMLSelectElement).value))}
							>
								{#each verseOptions(rangeEndSurah) as v (v)}
									<option value={v}>{v}</option>
								{/each}
							</select>
						</div>
					</div>
					<input type="hidden" name="rangeStart" value={rangeStart} />
					<input type="hidden" name="rangeEnd" value={rangeEnd} />
				</div>
			{/if}

			{#if form?.error}
				<p class="text-sm text-error">{form.error}</p>
			{/if}

			<button type="submit" class="btn btn-primary w-full" disabled={saving}>
				{saving ? 'Saving...' : 'Start journey'}
			</button>
		</form>
	</div>

{:else if data.goal}
	{#if !showEdit}
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
							class="w-full aspect-square rounded-lg max-w-9 {day.hasRead ? 'bg-primary' : day.isFuture ? 'bg-base-300/50' : 'bg-base-300'}"
							title={day.hasRead ? 'Read' : day.isFuture ? 'Upcoming' : 'Not read'}
						></div>
						<span class="text-[10px] text-base-content/40 {day.isToday ? 'font-bold text-base-content' : ''}">
							{day.dayName}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Daily verses progress -->
		{#if data.goal.type === 'daily_verses'}
			<div class="card bg-base-200 rounded-2xl p-5">
				<div class="flex items-center justify-between mb-3">
					<h2 class="font-semibold">Today's progress</h2>
					{#if isCompleted}
						<span class="badge badge-success badge-sm">Complete</span>
					{/if}
				</div>
				<div class="flex items-end gap-2 mb-3">
					<span class="text-4xl font-bold text-base-content">{todayCount}</span>
					<span class="text-base-content/40 mb-1">/ {dailyGoalTarget} verses</span>
				</div>
				<div class="w-full bg-base-300 rounded-full h-3">
					<div
						class="h-3 rounded-full transition-all {isCompleted ? 'bg-success' : 'bg-primary'}"
						style="width: {todayPercent}%"
					></div>
				</div>
				<p class="text-xs text-base-content/40 mt-2">
					{#if isCompleted}
						Goal complete for today.
					{:else}
						{dailyGoalTarget - todayCount} more verse{dailyGoalTarget - todayCount !== 1 ? 's' : ''} to go
					{/if}
				</p>
				<a href="/" class="btn btn-primary btn-sm mt-4 w-full">Continue reading</a>
			</div>
		{/if}

		<!-- Range goal progress -->
		{#if data.goal.type === 'range' && data.goal.rangeStart && data.goal.rangeEnd}
			<div class="card bg-base-200 rounded-2xl p-5">
				<h2 class="font-semibold mb-3">Range progress</h2>
				<div class="text-sm text-base-content/60 mb-1">
					{verseLabel(data.goal.rangeStart)} → {verseLabel(data.goal.rangeEnd)}
				</div>
				{#if data.rangeProgress}
					<div class="text-2xl font-bold mb-1">
						{data.rangeProgress.done}
						<span class="text-base font-normal text-base-content/40">verses read in range</span>
					</div>
				{/if}
				<a href={`/${data.goal.rangeStart.split(':')[0]}#${data.goal.rangeStart}`} class="btn btn-primary btn-sm mt-3 w-full">
					Continue from start
				</a>
			</div>
		{/if}

		<!-- Goal details + edit/delete -->
		<div class="card bg-base-200 rounded-2xl p-5">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-semibold">Current goal</h2>
				<button class="btn btn-xs btn-ghost" onclick={startEdit}>Edit</button>
			</div>
			<div class="text-sm text-base-content/60">
				{#if data.goal.type === 'daily_verses'}
					<span class="font-medium text-base-content">{data.goal.dailyTarget} verses</span> per day
				{:else}
					Verse range: <span class="font-medium text-base-content">{verseLabel(data.goal.rangeStart)} – {verseLabel(data.goal.rangeEnd)}</span>
				{/if}
			</div>
			<div class="text-xs text-base-content/30 mt-1">
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

	{:else}
		<!-- Inline edit form -->
		<div class="card bg-base-200 rounded-2xl p-6">
			<h2 class="text-lg font-bold mb-1">Update goal</h2>
			<p class="text-sm text-base-content/50 mb-5">Change your reading goal.</p>

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
				<fieldset>
					<legend class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">Goal type</legend>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all {goalType === 'daily_verses' ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/60 hover:border-base-content/30'}"
							onclick={() => (goalType = 'daily_verses')}
						>
							<div class="text-lg mb-0.5" aria-hidden="true">📖</div>
							Daily verses
						</button>
						<button
							type="button"
							class="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all {goalType === 'range' ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/60 hover:border-base-content/30'}"
							onclick={() => (goalType = 'range')}
						>
							<div class="text-lg mb-0.5" aria-hidden="true">🎯</div>
							Verse range
						</button>
					</div>
					<input type="hidden" name="type" value={goalType} />
				</fieldset>

				{#if goalType === 'daily_verses'}
					<div>
						<label for="dailyTargetEdit" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">
							Verses per day
						</label>
						<div class="flex items-center gap-3">
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" onclick={() => (dailyTarget = Math.max(1, dailyTarget - 1))} aria-label="Decrease">-</button>
							<input
								id="dailyTargetEdit"
								type="number"
								name="dailyTarget"
								min="1"
								max="100"
								bind:value={dailyTarget}
								class="input input-bordered w-24 text-center text-lg font-bold"
							/>
							<button type="button" class="btn btn-sm btn-circle btn-ghost border border-base-300" onclick={() => (dailyTarget = Math.min(100, dailyTarget + 1))} aria-label="Increase">+</button>
						</div>
						<div class="flex gap-2 mt-3 flex-wrap">
							{#each [5, 10, 20] as preset (preset)}
								<button
									type="button"
									class="btn btn-xs rounded-full {dailyTarget === preset ? 'btn-primary' : 'btn-ghost border border-base-300'}"
									onclick={() => (dailyTarget = preset)}
								>
									{preset}/day
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						<div>
							<label for="editRangeStartSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">From</label>
							<div class="flex gap-2">
								<select
									id="editRangeStartSurah"
									class="select select-bordered flex-1"
									value={rangeStartSurah}
									onchange={(e) => setRangeStart(Number((e.target as HTMLSelectElement).value), 1)}
								>
									{#each chapters as ch (ch.id)}
										<option value={ch.id}>{ch.id}. {ch.name}</option>
									{/each}
								</select>
								<select
									aria-label="Start verse"
									class="select select-bordered w-24"
									value={rangeStartAyah}
									onchange={(e) => setRangeStart(rangeStartSurah, Number((e.target as HTMLSelectElement).value))}
								>
									{#each verseOptions(rangeStartSurah) as v (v)}
										<option value={v}>{v}</option>
									{/each}
								</select>
							</div>
						</div>
						<div>
							<label for="editRangeEndSurah" class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2 block">To</label>
							<div class="flex gap-2">
								<select
									id="editRangeEndSurah"
									class="select select-bordered flex-1"
									value={rangeEndSurah}
									onchange={(e) => setRangeEnd(Number((e.target as HTMLSelectElement).value), 1)}
								>
									{#each chapters as ch (ch.id)}
										<option value={ch.id}>{ch.id}. {ch.name}</option>
									{/each}
								</select>
								<select
									aria-label="End verse"
									class="select select-bordered w-24"
									value={rangeEndAyah}
									onchange={(e) => setRangeEnd(rangeEndSurah, Number((e.target as HTMLSelectElement).value))}
								>
									{#each verseOptions(rangeEndSurah) as v (v)}
										<option value={v}>{v}</option>
									{/each}
								</select>
							</div>
						</div>
						<input type="hidden" name="rangeStart" value={rangeStart} />
						<input type="hidden" name="rangeEnd" value={rangeEnd} />
					</div>
				{/if}

				{#if form?.error}
					<p class="text-sm text-error">{form.error}</p>
				{/if}

				<div class="flex gap-2">
					<button type="button" class="btn btn-ghost flex-1" onclick={() => (showEdit = false)}>Cancel</button>
					<button type="submit" class="btn btn-primary flex-1" disabled={saving}>
						{saving ? 'Saving...' : 'Update goal'}
					</button>
				</div>
			</form>
		</div>
	{/if}

{/if}

</div>
