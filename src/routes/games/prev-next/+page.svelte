<script lang="ts">
	import JuzSelector from '$lib/components/games/JuzSelector.svelte';
	import { validateGuestName } from '$lib/games/data';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Phase = 'setup' | 'loading' | 'playing' | 'submitting' | 'results';
	type Question = {
		verse_key: string;
		text: string;
		mode: 'prev' | 'next';
		options: { verse_key: string; text: string }[];
		correct_key: string;
	};

	let phase = $state<Phase>('setup');
	let juzStart = $state<number | null>(null);
	let juzEnd = $state<number | null>(null);
	let gameMode = $state<'prev' | 'next'>('next');
	let guestName = $state('');
	let nameError = $state('');
	let questions = $state<Question[]>([]);
	let currentQ = $state(0);
	let selected = $state<string | null>(null);
	let answers = $state<boolean[]>([]);
	let leaderboardOverride = $state<typeof data.leaderboard | null>(null);
	const leaderboard = $derived(leaderboardOverride ?? data.leaderboard ?? []);
	let loadError = $state('');

	const score = $derived(answers.filter(Boolean).length);
	const isCorrect = $derived(
		selected !== null && questions[currentQ] && selected === questions[currentQ].correct_key
	);

	function onJuzSelect(start: number, end: number) {
		juzStart = start;
		juzEnd = end;
	}

	async function startGame() {
		if (juzStart === null || juzEnd === null) return;
		if (!data.user) {
			const err = validateGuestName(guestName);
			if (err) { nameError = err; return; }
		}
		nameError = '';
		phase = 'loading';
		loadError = '';
		try {
			const res = await fetch('/api/games/questions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ game: 'prev-next', juz_start: juzStart, juz_end: juzEnd, mode: gameMode })
			});
			if (!res.ok) throw new Error('Failed to load questions');
			const d = await res.json() as { questions: Question[] };
			questions = d.questions;
			currentQ = 0;
			selected = null;
			answers = [];
			phase = 'playing';
		} catch {
			loadError = 'Could not load questions. Try again.';
			phase = 'setup';
		}
	}

	function pick(key: string) {
		if (selected !== null) return;
		selected = key;
		answers = [...answers, key === questions[currentQ].correct_key];
	}

	function next() {
		if (currentQ + 1 >= questions.length) {
			submitScore();
		} else {
			currentQ++;
			selected = null;
		}
	}

	async function submitScore() {
		phase = 'submitting';
		const name = data.user?.name ?? guestName.trim();
		try {
			await fetch('/api/games/score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: 'prev-next',
					player_name: name,
					score,
					juz_start: juzStart,
					juz_end: juzEnd
				})
			});
			const lb = await fetch('/api/games/leaderboard/prev-next');
			if (lb.ok) leaderboardOverride = await lb.json();
		} catch {
			// silent
		}
		phase = 'results';
	}

	function playAgain() {
		phase = 'setup';
		juzStart = null;
		juzEnd = null;
		questions = [];
		answers = [];
		selected = null;
		currentQ = 0;
		leaderboardOverride = null;
	}
</script>

<svelte:head>
	<title>Previous / Next Ayah — Quran Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="max-w-xl mx-auto px-4 py-8">
	<div class="mb-6">
		<h1 class="text-xl font-bold">Previous / Next Ayah</h1>
	</div>

	<!-- Setup -->
	{#if phase === 'setup'}
		<div class="space-y-6">
			<div>
				<p class="font-medium mb-2 text-sm">Mode:</p>
				<div class="flex rounded-lg bg-base-200 p-0.5 w-fit gap-0.5">
					<button
						type="button"
						class="px-4 py-1.5 text-sm font-medium rounded-md transition-all {gameMode === 'next' ? 'bg-base-100 shadow text-base-content' : 'text-base-content/50 hover:text-base-content'}"
						onclick={() => (gameMode = 'next')}
					>Next →</button>
					<button
						type="button"
						class="px-4 py-1.5 text-sm font-medium rounded-md transition-all {gameMode === 'prev' ? 'bg-base-100 shadow text-base-content' : 'text-base-content/50 hover:text-base-content'}"
						onclick={() => (gameMode = 'prev')}
					>← Previous</button>
				</div>
			</div>

			<div>
				<p class="font-medium mb-3 text-sm">Select your memorized juz range:</p>
				<JuzSelector onSelect={onJuzSelect} />
			</div>

			{#if !data.user}
				<div>
					<label class="text-sm font-medium block mb-1" for="guest-name">Your name</label>
					<input
						id="guest-name"
						type="text"
						bind:value={guestName}
						placeholder="Enter your name"
						maxlength="30"
						class="input input-bordered w-full"
					/>
					{#if nameError}<p class="text-error text-xs mt-1">{nameError}</p>{/if}
				</div>
			{/if}

			{#if loadError}<p class="text-error text-sm">{loadError}</p>{/if}

			<button
				class="btn btn-success w-full"
				disabled={juzStart === null || (!data.user && !guestName.trim())}
				onclick={startGame}
			>
				Start Game
			</button>

			{@render Leaderboard({ entries: leaderboard })}
		</div>

	<!-- Loading -->
	{:else if phase === 'loading'}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<span class="loading loading-spinner loading-lg text-success"></span>
			<p class="text-base-content/60 text-sm">Loading questions…</p>
		</div>

	<!-- Playing -->
	{:else if phase === 'playing'}
		{@const q = questions[currentQ]}
		<div class="space-y-5">
			<div class="flex items-center justify-between text-sm text-base-content/60">
				<span>Question {currentQ + 1} / {questions.length}</span>
				<span>{answers.filter(Boolean).length} correct</span>
			</div>

			<div class="w-full bg-base-300 rounded-full h-1.5">
				<div class="bg-success h-1.5 rounded-full transition-all" style="width: {(currentQ / questions.length) * 100}%"></div>
			</div>

			<div class="card bg-base-200 border border-base-300">
				<div class="card-body p-5 text-center">
					<p class="text-xs text-base-content/40 mb-3">
						Which ayah comes <strong>{q.mode === 'next' ? 'after' : 'before'}</strong> this?
					</p>
					<p class="text-2xl leading-loose" dir="rtl" style="font-family: 'Amiri', serif;">{q.text}</p>
				</div>
			</div>

			<div class="space-y-2">
				{#each q.options as opt (opt.verse_key)}
					<button
						class="w-full rounded-lg border px-4 py-3 text-right transition-all
							{selected === null ? 'border-base-300 bg-base-200 hover:border-success/50' : ''}
							{selected !== null && opt.verse_key === q.correct_key ? 'border-success bg-success/10 text-success' : ''}
							{selected === opt.verse_key && opt.verse_key !== q.correct_key ? 'border-error bg-error/10 text-error' : ''}"
						onclick={() => pick(opt.verse_key)}
						disabled={selected !== null}
						dir="rtl"
					>
						<span style="font-family: 'Amiri', serif; font-size: 1.15rem; line-height: 2;">{opt.text}</span>
					</button>
				{/each}
			</div>

			{#if selected !== null}
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium {isCorrect ? 'text-success' : 'text-error'}">
						{isCorrect ? '✓ Correct!' : `✗ The answer was ${q.correct_key}`}
					</p>
					<button class="btn btn-sm btn-success" onclick={next}>
						{currentQ + 1 >= questions.length ? 'See Results' : 'Next →'}
					</button>
				</div>
			{/if}
		</div>

	<!-- Submitting -->
	{:else if phase === 'submitting'}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<span class="loading loading-spinner loading-lg text-success"></span>
			<p class="text-base-content/60 text-sm">Saving score…</p>
		</div>

	<!-- Results -->
	{:else if phase === 'results'}
		<div class="space-y-6">
			<div class="card bg-base-200 border border-base-300 text-center">
				<div class="card-body py-8">
					<p class="text-5xl font-bold text-success">{score}<span class="text-2xl text-base-content/40">/10</span></p>
					<p class="text-base-content/60 mt-2 text-sm">
						{score === 10 ? 'Perfect score!' : score >= 7 ? 'Great job!' : score >= 5 ? 'Good effort!' : 'Keep practicing!'}
					</p>
				</div>
			</div>
			<button class="btn btn-success w-full" onclick={playAgain}>Play Again</button>
			{@render Leaderboard({ entries: leaderboard })}
		</div>
	{/if}
</div>

{#snippet Leaderboard({ entries }: { entries: typeof leaderboard })}
	{#if entries?.length > 0}
		<div>
			<h2 class="font-semibold text-sm mb-3">Leaderboard</h2>
			<div class="overflow-x-auto rounded-lg border border-base-300">
				<table class="table table-sm w-full">
					<thead>
						<tr class="text-base-content/50 text-xs">
							<th>#</th>
							<th>Player</th>
							<th>Score</th>
							<th>Juz</th>
						</tr>
					</thead>
					<tbody>
						{#each entries as entry, i (entry.playerName + i)}
							<tr class="{i === 0 ? 'font-semibold' : ''}">
								<td class="text-base-content/40">{i + 1}</td>
								<td>{entry.playerName}</td>
								<td class="text-success font-bold">{entry.score}/10</td>
								<td class="text-xs text-base-content/50">
									{entry.juzStart === entry.juzEnd ? `Juz ${entry.juzStart}` : `Juz ${entry.juzStart}–${entry.juzEnd}`}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
{/snippet}
