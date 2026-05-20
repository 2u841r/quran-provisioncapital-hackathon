<svelte:head>
	<title>Games — Quran</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-10">
	<h1 class="text-2xl font-bold mb-2">Quran Games</h1>
	<p class="text-base-content/60 text-sm mb-8">Test your memorization. Play, score, and compete.</p>

	<div class="grid gap-4 sm:grid-cols-2">
		<a
			href="/games/which-surah"
			class="card bg-base-200 border border-base-300 hover:border-success/50 hover:bg-base-300 transition-all no-underline"
		>
			<div class="card-body p-5">
				<div class="text-3xl mb-2">📖</div>
				<h2 class="card-title text-base">Which Surah?</h2>
				<p class="text-sm text-base-content/60">
					An ayah appears — pick which surah it's from. 10 questions per round.
				</p>
			</div>
		</a>

		<a
			href="/games/prev-next"
			class="card bg-base-200 border border-base-300 hover:border-success/50 hover:bg-base-300 transition-all no-underline"
		>
			<div class="card-body p-5">
				<div class="text-3xl mb-2">🔗</div>
				<h2 class="card-title text-base">Previous / Next Ayah</h2>
				<p class="text-sm text-base-content/60">
					Given an ayah, identify which ayah comes before or after it.
				</p>
			</div>
		</a>
	</div>
</div>
