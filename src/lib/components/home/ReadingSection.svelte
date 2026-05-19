<script lang="ts">
	import type { Chapter } from '$lib/types/quran';
	import juzMappings from '$lib/data/juz-to-chapter-verse-mappings.json';

	interface Props {
		surahs: (Chapter & { id: number })[];
	}

	const { surahs }: Props = $props();

	type View = 'surah' | 'juz' | 'revelation';
	let view = $state<View>('surah');
	let sortAsc = $state(true);

	const chapterById = $derived(Object.fromEntries(surahs.map((s) => [String(s.id), s])));

	const juzList = $derived.by(() => {
		const entries = Object.entries(juzMappings as Record<string, Record<string, string>>);
		entries.sort(([a], [b]) => Number(a) - Number(b));
		if (!sortAsc) entries.reverse();
		return entries;
	});

	const visibleChapters = $derived.by(() => {
		let list = [...surahs];
		if (view === 'revelation') {
			list.sort((a, b) => (a.revelationOrder ?? 0) - (b.revelationOrder ?? 0));
		}
		if (!sortAsc) list.reverse();
		return list;
	});
</script>

<main class="mx-auto max-w-5xl px-4 py-8">
	<div class="pb-4">
		<div class="flex items-center justify-between gap-2">
			<div role="tablist" class="tabs tabs-border">
				<button
					role="tab"
					class="tab {view === 'surah' ? 'tab-active' : ''}"
					onclick={() => (view = 'surah')}>Surah</button
				>
				<button
					role="tab"
					class="tab {view === 'juz' ? 'tab-active' : ''}"
					onclick={() => (view = 'juz')}>Juz</button
				>
				<button
					role="tab"
					class="tab {view === 'revelation' ? 'tab-active' : ''}"
					onclick={() => (view = 'revelation')}
				>
					<span class="sm:hidden">Revelation</span>
					<span class="hidden sm:inline">Revelation Order</span>
				</button>
			</div>

			<button
				onclick={() => (sortAsc = !sortAsc)}
				class="flex shrink-0 items-center gap-1 text-xs font-bold uppercase text-base-content/50 hover:text-primary"
			>
				<span>{sortAsc ? 'Ascending' : 'Descending'}</span>
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="transition-transform {sortAsc ? 'rotate-180' : ''}"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
		</div>

		{#if view === 'revelation'}
			<div
				class="mt-4 rounded-lg border border-base-300 bg-base-200/60 p-3 text-xs text-base-content/70"
			>
				Chapters ordered by revelation sequence.
				<a
					href="https://tanzil.net/docs/revelation_order"
					target="_blank"
					rel="noreferrer"
					class="underline">Source: tanzil.net</a
				>.
			</div>
		{/if}
	</div>

	{#if view === 'juz'}
		<div class="columns-1 gap-3 md:columns-2 lg:columns-3">
			{#each juzList as [juzId, chapterMap] (juzId)}
				<div class="mb-3 break-inside-avoid rounded-lg border border-base-200 bg-base-100 p-3">
					<a
						href="/juz/{juzId}"
						class="mb-2 flex items-center justify-between border-b border-base-200 pb-2 text-primary no-underline hover:opacity-75"
					>
						<span class="text-sm font-semibold">Juz {juzId}</span>
						<span class="text-xs uppercase">Read Juz</span>
					</a>
					{#each Object.entries(chapterMap) as [chId, verseRange] (chId)}
						{@const ch = chapterById[chId]}
						{#if ch}
							{@const firstVerse = String(verseRange).split('-')[0]}
							<a
								href="/{chId}?startingVerse={firstVerse}"
								class="flex items-center justify-between gap-3 rounded px-2 py-2 no-underline hover:bg-base-200"
							>
								<div class="flex min-w-0 items-center gap-3">
									<div
										class="flex h-7 w-7 shrink-0 rotate-45 items-center justify-center rounded border border-base-300 text-[0.65rem] font-semibold text-base-content/70"
									>
										<span class="-rotate-45">{ch.id}</span>
									</div>
									<div class="min-w-0">
										<div class="truncate text-xs font-semibold text-base-content">
											{ch.nameSimple}
										</div>
										<div class="truncate text-[0.65rem] text-base-content/60">v. {verseRange}</div>
									</div>
								</div>
								<span class="chapter-icon shrink-0 text-base leading-none text-primary"
									>{String(ch.id).padStart(3, '0')}</span
								>
							</a>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
			{#each visibleChapters as ch (ch.id)}
				<a
					href="/{ch.id}"
					class="flex items-center justify-between gap-3 rounded-lg border border-base-200 bg-base-100 px-4 py-3 no-underline transition-colors hover:bg-base-200"
				>
					<div class="flex min-w-0 items-center gap-3">
						<div
							class="flex h-8 w-8 shrink-0 rotate-45 items-center justify-center rounded border border-base-300 text-xs font-semibold text-base-content/70"
						>
							<span class="-rotate-45">{ch.id}</span>
						</div>
						<div class="min-w-0">
							<div class="truncate text-sm font-semibold text-base-content">{ch.nameSimple}</div>
							<div class="truncate text-xs text-base-content/60">{ch.translatedName.name}</div>
						</div>
					</div>
					<div class="flex shrink-0 flex-col items-end">
						<span class="chapter-icon text-lg leading-none text-primary"
							>{String(ch.id).padStart(3, '0')}</span
						>
						<div class="mt-1 text-[0.65rem] text-base-content/50">{ch.versesCount} Ayahs</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</main>

<style>
	.chapter-icon {
		font-family: 'surahnames';
	}
</style>
