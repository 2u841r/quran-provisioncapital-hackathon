<script lang="ts">
	import JuzSelector from '$lib/components/games/JuzSelector.svelte';
	import { validateGuestName, SURAH_NAMES } from '$lib/games/data';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Phase = 'setup' | 'loading' | 'playing' | 'submitting' | 'results';
	type Question = {
		verse_key: string;
		text: string;
		options: { id: number; name: string }[];
		correct_id: number;
	};

	let phase = $state<Phase>('setup');
	let juzStart = $state<number | null>(null);
	let juzEnd = $state<number | null>(null);
	let guestName = $state('');
	let nameError = $state('');
	let questions = $state<Question[]>([]);
	let currentQ = $state(0);
	let selected = $state<number | null>(null);
	let answers = $state<boolean[]>([]);
	let leaderboardOverride = $state<typeof data.leaderboard | null>(null);
	const leaderboard = $derived(leaderboardOverride ?? data.leaderboard ?? []);
	let loadError = $state('');

	const score = $derived(answers.filter(Boolean).length);
	const isCorrect = $derived(selected !== null && questions[currentQ] && selected === questions[currentQ].correct_id);

	function onJuzSelect(start: number, end: number) {
		juzStart = start;
		juzEnd = end;
	}

	async function startGame() {
		if (juzStart === null || juzEnd === null) return;

		const name = data.user?.name ?? guestName.trim();
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
				body: JSON.stringify({ game: 'which-surah', juz_start: juzStart, juz_end: juzEnd })
			});
			if (!res.ok) throw new Error('Failed to load questions');
			const data2 = await res.json() as { questions: Question[] };
			questions = data2.questions;
			currentQ = 0;
			selected = null;
			answers = [];
			phase = 'playing';
		} catch {
			loadError = 'Could not load questions. Try again.';
			phase = 'setup';
		}
	}

	function pick(id: number) {
		if (selected !== null) return;
		selected = id;
		answers = [...answers, id === questions[currentQ].correct_id];
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
					game_id: 'which-surah',
					player_name: name,
					score,
					juz_start: juzStart,
					juz_end: juzEnd
				})
			});
			const lb = await fetch('/api/games/leaderboard/which-surah');
			if (lb.ok) leaderboardOverride = await lb.json();
		} catch {
			// score save failed silently
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
	<title>Which Surah? — Quran Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="max-w-xl mx-auto px-4 py-8">
	<div class="mb-6">
		<h1 class="text-xl font-bold">Which Surah?</h1>
	</div>

	<!-- Setup -->
	{#if phase === 'setup'}
		<div class="space-y-6">
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
		<div class="space-y-6">
			<div class="flex items-center justify-between text-sm text-base-content/60">
				<span>Question {currentQ + 1} / {questions.length}</span>
				<span>{answers.filter(Boolean).length} correct</span>
			</div>

			<div class="w-full bg-base-300 rounded-full h-1.5">
				<div class="bg-success h-1.5 rounded-full transition-all" style="width: {(currentQ / questions.length) * 100}%"></div>
			</div>

			<div class="card bg-base-200 border border-base-300">
				<div class="card-body p-6 text-center">
					<p class="text-xs text-base-content/40 mb-3">Which surah is this ayah from?</p>
					<p
						class="text-2xl leading-loose"
						dir="rtl"
						style="font-family: 'Amiri', serif;"
					>{q.text}</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				{#each q.options as opt (opt.id)}
					<button
						class="btn btn-outline h-auto py-3 px-4 text-sm font-medium transition-all
							{selected === null ? 'hover:border-success hover:text-success' : ''}
							{selected !== null && opt.id === q.correct_id ? 'btn-success border-success text-white' : ''}
							{selected === opt.id && opt.id !== q.correct_id ? 'btn-error border-error text-white' : ''}"
						onclick={() => pick(opt.id)}
						disabled={selected !== null}
					>
						{opt.name}
					</button>
				{/each}
			</div>

			{#if selected !== null}
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium {isCorrect ? 'text-success' : 'text-error'}">
						{isCorrect ? '✓ Correct!' : `✗ It was ${SURAH_NAMES[q.correct_id]?.en ?? ''}`}
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
