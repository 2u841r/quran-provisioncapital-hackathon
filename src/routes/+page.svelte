<script lang="ts">
	import type { PageData } from './$types';
	import { fetchSearch } from '$lib/api/quran';
	import type { SearchResult } from '$lib/types/quran';
	import VoiceSearch from '$lib/components/VoiceSearch.svelte';
	// @ts-expect-error -- Vite raw import
	import backgroundSvg from '$lib/assets/background.svg?raw';
	// @ts-expect-error -- Vite raw import
	import logoSvg from '$lib/assets/logo_main.svg?raw';
	import juzMappings from '$lib/data/juz-to-chapter-verse-mappings.json';
	import HeroButtons from '$lib/components/home/HeroButtons/index.svelte';
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

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const chapterMatches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return surahs
			.filter(
				(s) =>
					s.nameSimple?.toLowerCase().includes(q) ||
					s.nameComplex?.toLowerCase().includes(q) ||
					s.nameArabic?.includes(q) ||
					s.translatedName?.name?.toLowerCase().includes(q) ||
					String(s.id) === q
			)
			.slice(0, 5);
	});

	let homeInputEl = $state<HTMLInputElement | null>(null);

	function setQuery(q: string) {
		query = q;
		if (homeInputEl) homeInputEl.value = q;
		open = true;
		onInput({ target: { value: q } } as unknown as Event);
	}

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
	<div
		class="hero-bg absolute inset-0 z-0 overflow-hidden bg-base-200"
		style="--color-calligraphy: var(--color-base-300);"
	>
		<div class="hero-svg" style="transform: translateY(-40%)">
			{@html backgroundSvg}
		</div>
	</div>

	<div class="relative z-10">
		<!-- Inner container -->
		<div class="mx-auto flex max-w-3xl flex-col items-center px-2 py-5 md:py-[30px]">
			<!-- Logo (hidden on mobile) -->
			<div class="hidden pb-5 md:block">
				<div class="logo-main" aria-label="Quran.com" style="color: var(--color-primary);">
					{@html logoSvg}
				</div>
			</div>

			<!-- Search input + dropdown -->
			<div class="relative w-full max-w-xl">
				<label class="input-bordered input flex w-full items-center gap-2 rounded-full bg-base-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="opacity-50"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3" />
					</svg>
					<input
						bind:this={homeInputEl}
						type="search"
						placeholder="Search the Quran"
						class="grow bg-transparent outline-none"
						value={query}
						oninput={onInput}
						onfocus={() => (open = true)}
					/>
					{#if loading}
						<span class="loading loading-xs loading-spinner"></span>
					{/if}
					<VoiceSearch onTranscript={setQuery} />
				</label>

				{#if open && (loading || results.length > 0 || chapterMatches.length > 0 || query.trim())}
					<div
						class="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-base-300 bg-base-100 shadow-xl"
					>
						{#if chapterMatches.length > 0}
							<div
								class="px-4 pt-3 pb-1 text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase"
							>
								Surahs
							</div>
							{#each chapterMatches as ch (ch.id)}
								<a
									href="/{ch.id}"
									class="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-base-200"
								>
									<span
										class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-base-200 font-mono text-xs text-base-content/60"
										>{ch.id}</span
									>
									<div class="min-w-0 flex-1">
										<div class="truncate text-sm font-semibold text-base-content">
											{ch.nameSimple}
										</div>
										<div class="truncate text-xs text-base-content/60">
											{ch.translatedName.name} · {ch.versesCount} verses
										</div>
									</div>
									<span
										class="text-base text-base-content/70"
										dir="rtl"
										lang="ar"
										style="font-family: 'UthmanicHafs', serif;">{ch.nameArabic}</span
									>
								</a>
							{/each}
						{/if}

						{#if results.length > 0}
							<div
								class="px-4 pt-3 pb-1 text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase {chapterMatches.length >
								0
									? 'border-t border-base-200'
									: ''}"
							>
								Verses
							</div>
							{#each results as r (r.verseKey)}
								<a
									href="/{r.verseKey.split(':')[0]}?startingVerse={r.verseKey.split(':')[1]}"
									class="block border-b border-base-200 px-4 py-3 no-underline last:border-b-0 hover:bg-base-200"
								>
									<div class="mb-1 flex items-center justify-between">
										<span class="font-mono text-xs text-primary">{r.verseKey}</span>
									</div>
									<p
										class="mb-1 text-right text-sm leading-relaxed"
										dir="rtl"
										lang="ar"
										style="font-family: 'UthmanicHafs', serif;"
									>
										{stripHtml(r.text)}
									</p>
									{#if r.translations?.[0]}
										<p class="text-xs leading-snug text-base-content/70">
											{stripHtml(r.translations[0].text)}
										</p>
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

			<HeroButtons onNavigate={() => (navOpen = true)} />
		</div>
	</div>
</div>

<!-- Tabs + Sort + Chapter list -->
<main class="mx-auto max-w-5xl px-4 py-8">
	<!-- Tabs row -->
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
					onclick={() => (view = 'revelation')}>
					<span class="sm:hidden">Revelation</span>
					<span class="hidden sm:inline">Revelation Order</span>
				</button
				>
			</div>

			<!-- Sorter -->
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
