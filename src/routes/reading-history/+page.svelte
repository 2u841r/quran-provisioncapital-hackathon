<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function verseUrl(verseKey: string): string {
		const [chapter, verse] = verseKey.split(':');
		return `/${chapter}/${verse}`;
	}

	function surahName(verseKey: string): string {
		const [chapter, verse] = verseKey.split(':');
		return `${chapter}:${verse}`;
	}
</script>

<svelte:head>
	<title>Reading History</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-bold">Reading History</h1>

	{#if data.grouped.length === 0}
		<div class="py-16 text-center text-base-content/50">
			<p class="text-sm">No reading history yet.</p>
			<p class="mt-1 text-sm">Start reading a surah to track your progress.</p>
			<a href="/" class="btn btn-primary btn-sm mt-4">Go to Quran</a>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each data.grouped as { date, verseKeys } (date)}
				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/40">
						{formatDate(date)}
					</p>
					<div class="card bg-base-200">
						<div class="card-body p-3">
							<div class="flex flex-wrap gap-2">
								{#each verseKeys as verseKey (verseKey)}
									<a
										href={verseUrl(verseKey)}
										class="badge badge-ghost font-mono text-xs hover:badge-primary transition-colors"
									>
										{surahName(verseKey)}
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
