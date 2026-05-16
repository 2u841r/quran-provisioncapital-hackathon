<script lang="ts">
	import type { PageData } from './$types';
	import { fetchSearch } from '$lib/api/quran';
	import type { SearchResult } from '$lib/types/quran';
	// @ts-expect-error -- Vite raw import
	import backgroundSvg from '$lib/assets/background.svg?raw';
	// @ts-expect-error -- Vite raw import
	import logoSvg from '$lib/assets/logo_main.svg?raw';
	import juzMappings from '$lib/data/juz-to-chapter-verse-mappings.json';
	import NavigationDrawer from '$lib/components/NavigationDrawer.svelte';

	let navOpen = $state(false);

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const surahs = $derived(
		Object.entries(data.chapters)
			.map(([id, ch]) => ({ id: Number(id), ...ch }))
			.sort((a, b) => a.id - b.id)
	);

	type View = 'surah' | 'juz' | 'revelation';
	let view = $state<View>('surah');
	let sortAsc = $state(true);

	const chapterById = $derived(Object.fromEntries(surahs.map(s => [String(s.id), s])));

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

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const chapterMatches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return surahs.filter(s =>
			s.nameSimple?.toLowerCase().includes(q) ||
			s.nameComplex?.toLowerCase().includes(q) ||
			s.nameArabic?.includes(q) ||
			s.translatedName?.name?.toLowerCase().includes(q) ||
			String(s.id) === q
		).slice(0, 5);
	});

	function onInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
		open = true;
		if (debounceTimer) clearTimeout(debounceTimer);
		const q = query.trim();
		if (!q) {
			results = [];
			loading = false;
			return;
		}
		loading = true;
		debounceTimer = setTimeout(async () => {
			try {
				const data = await fetchSearch(fetch, q);
				results = data.search?.results ?? [];
			} catch {
				results = [];
			} finally {
				loading = false;
			}
		}, 300);
	}

	function stripHtml(s: string): string {
		return s.replace(/<[^>]+>/g, '');
	}
</script>

<svelte:head>
	<title>Quran</title>
	<link rel="preload" as="image" href="/images/background.png" />
</svelte:head>

<!-- Hero (HomePageHero_outerContainer) -->
<div class="hero-outer relative isolate">
	<!-- Background image -->
	<div class="hero-bg absolute inset-0 z-0 overflow-hidden bg-base-200" style="--color-calligraphy: var(--color-base-300);">
		<div class="hero-svg" style="transform: translateY(-40%)">
			{@html backgroundSvg}
		</div>
	</div>

	<div class="relative z-10">
		<!-- Inner container -->
		<div class="mx-auto flex flex-col items-center px-2 py-5 md:py-[30px] max-w-3xl">
			<!-- Logo (hidden on mobile) -->
			<div class="hidden md:block pb-5">
				<div class="logo-main" aria-label="Quran.com" style="color: var(--color-primary);">{@html logoSvg}</div>
			</div>

			<!-- Search input + dropdown -->
			<div class="relative w-full max-w-xl">
				<label class="input input-bordered flex items-center gap-2 w-full bg-base-100 rounded-full">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50">
						<circle cx="11" cy="11" r="8"/>
						<path d="m21 21-4.3-4.3"/>
					</svg>
					<input
						type="search"
						placeholder="Search the Quran"
						class="grow bg-transparent outline-none"
						value={query}
						oninput={onInput}
						onfocus={() => (open = true)}
					/>
					{#if loading}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
				</label>

				{#if open && (loading || results.length > 0 || chapterMatches.length > 0 || query.trim())}
					<div class="absolute z-20 mt-2 w-full max-h-96 overflow-y-auto bg-base-100 border border-base-300 rounded-2xl shadow-xl">
						{#if chapterMatches.length > 0}
							<div class="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold">Surahs</div>
							{#each chapterMatches as ch (ch.id)}
								<a
									href="/{ch.id}"
									class="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 no-underline"
								>
									<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-base-200 text-xs font-mono text-base-content/60 shrink-0">{ch.id}</span>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-base-content truncate">{ch.nameSimple}</div>
										<div class="text-xs text-base-content/60 truncate">{ch.translatedName.name} · {ch.versesCount} verses</div>
									</div>
									<span class="text-base text-base-content/70" dir="rtl" lang="ar" style="font-family: 'UthmanicHafs', serif;">{ch.nameArabic}</span>
								</a>
							{/each}
						{/if}

						{#if results.length > 0}
							<div class="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold {chapterMatches.length > 0 ? 'border-t border-base-200' : ''}">Verses</div>
							{#each results as r (r.verseKey)}
								<a
									href="/{r.verseKey.split(':')[0]}?startingVerse={r.verseKey.split(':')[1]}"
									class="block px-4 py-3 hover:bg-base-200 border-b border-base-200 last:border-b-0 no-underline"
								>
									<div class="flex items-center justify-between mb-1">
										<span class="text-xs font-mono text-primary">{r.verseKey}</span>
									</div>
									<p class="text-right text-sm leading-relaxed mb-1" dir="rtl" lang="ar" style="font-family: 'UthmanicHafs', serif;">{stripHtml(r.text)}</p>
									{#if r.translations?.[0]}
										<p class="text-xs text-base-content/70 leading-snug">{stripHtml(r.translations[0].text)}</p>
									{/if}
								</a>
							{/each}
						{:else if loading}
							<div class="p-4 text-sm text-base-content/50">Searching verses...</div>
						{:else if !chapterMatches.length}
							<div class="p-4 text-sm text-base-content/50">No results</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Buttons -->
			<div class="flex gap-2 md:gap-[15px] mt-2 md:mt-4">
				<button
					class="btn btn-sm md:btn-md btn-ghost bg-base-100 rounded-full"
					onclick={() => (navOpen = true)}
					data-testid="navigate-quran-button"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="8" y1="6" x2="21" y2="6"/>
						<line x1="8" y1="12" x2="21" y2="12"/>
						<line x1="8" y1="18" x2="21" y2="18"/>
						<line x1="3" y1="6" x2="3.01" y2="6"/>
						<line x1="3" y1="12" x2="3.01" y2="12"/>
						<line x1="3" y1="18" x2="3.01" y2="18"/>
					</svg>
					Navigate Quran
				</button>
				<button class="btn btn-sm md:btn-md btn-ghost bg-base-100 rounded-full">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
					</svg>
					Popular
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Tabs + Sort + Chapter list -->
<main class="max-w-5xl mx-auto px-4 py-8">
	<!-- Tabs row -->
	<div class="pb-4">
		<div role="tablist" class="tabs tabs-bordered">
			<button
				role="tab"
				class="tab {view === 'surah' ? 'tab-active' : ''}"
				onclick={() => (view = 'surah')}
			>Surah</button>
			<button
				role="tab"
				class="tab {view === 'juz' ? 'tab-active' : ''}"
				onclick={() => (view = 'juz')}
			>Juz</button>
			<button
				role="tab"
				class="tab {view === 'revelation' ? 'tab-active' : ''}"
				onclick={() => (view = 'revelation')}
			>Revelation Order</button>
		</div>

		<!-- Sorter -->
		<div class="flex justify-end items-center gap-1 mt-2 text-xs">
			<span class="uppercase text-base-content/50">Sort by:</span>
			<button
				onclick={() => (sortAsc = !sortAsc)}
				class="flex items-center gap-1 font-bold uppercase text-base-content hover:text-primary"
			>
				<span>{sortAsc ? 'Ascending' : 'Descending'}</span>
				<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform {sortAsc ? 'rotate-180' : ''}">
					<path d="m6 9 6 6 6-6"/>
				</svg>
			</button>
		</div>

		{#if view === 'revelation'}
			<div class="mt-4 p-3 text-xs rounded-lg border border-base-300 bg-success/10 text-base-content/70">
				The chapters are ordered by the order in which they were revealed.
				<a href="https://tanzil.net/docs/revelation_order" target="_blank" rel="noreferrer" class="underline">Source: tanzil.net</a>.
			</div>
		{/if}
	</div>

	{#if view === 'juz'}
		<div class="columns-1 md:columns-2 lg:columns-3 gap-3">
			{#each juzList as [juzId, chapterMap] (juzId)}
				<div class="break-inside-avoid mb-3 rounded-lg border border-base-200 bg-base-100 p-3">
					<a href="/juz/{juzId}" class="flex items-center justify-between text-primary hover:opacity-75 no-underline pb-2 border-b border-base-200 mb-2">
						<span class="font-semibold text-sm">Juz {juzId}</span>
						<span class="text-xs uppercase">Read Juz</span>
					</a>
					{#each Object.entries(chapterMap) as [chId, verseRange] (chId)}
						{@const ch = chapterById[chId]}
						{#if ch}
							{@const firstVerse = String(verseRange).split('-')[0]}
							<a
								href="/{chId}?startingVerse={firstVerse}"
								class="flex items-center justify-between gap-3 px-2 py-2 rounded hover:bg-base-200 no-underline"
							>
								<div class="flex items-center gap-3 min-w-0">
									<div class="w-7 h-7 shrink-0 flex items-center justify-center text-[0.65rem] font-semibold text-base-content/70 rotate-45 border border-base-300 rounded">
										<span class="-rotate-45">{ch.id}</span>
									</div>
									<div class="min-w-0">
										<div class="text-xs font-semibold text-base-content truncate">{ch.nameSimple}</div>
										<div class="text-[0.65rem] text-base-content/60 truncate">v. {verseRange}</div>
									</div>
								</div>
								<span class="chapter-icon text-primary text-base leading-none shrink-0">{String(ch.id).padStart(3, '0')}</span>
							</a>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
			{#each visibleChapters as ch (ch.id)}
				<a
					href="/{ch.id}"
					class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-base-100 hover:bg-base-200 border border-base-200 transition-colors no-underline"
				>
					<div class="flex items-center gap-3 min-w-0">
						<div class="w-8 h-8 shrink-0 flex items-center justify-center text-xs font-semibold text-base-content/70 rotate-45 border border-base-300 rounded">
							<span class="-rotate-45">{ch.id}</span>
						</div>
						<div class="min-w-0">
							<div class="text-sm font-semibold text-base-content truncate">{ch.nameSimple}</div>
							<div class="text-xs text-base-content/60 truncate">{ch.translatedName.name}</div>
						</div>
					</div>
					<div class="flex flex-col items-end shrink-0">
						<span class="chapter-icon text-primary text-lg leading-none">{String(ch.id).padStart(3, '0')}</span>
						<div class="text-[0.65rem] text-base-content/50 mt-1">{ch.versesCount} Ayahs</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</main>

<NavigationDrawer open={navOpen} onClose={() => (navOpen = false)} chapters={surahs} />

<style>
	.hero-svg :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
	.logo-main :global(svg) {
		height: 3rem;
		width: auto;
		display: block;
	}
	.chapter-icon {
		font-family: 'surahnames';
	}
</style>
