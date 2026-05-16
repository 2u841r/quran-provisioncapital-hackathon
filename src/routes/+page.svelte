<script lang="ts">
	import type { PageData } from './$types';
	import { fetchSearch } from '$lib/api/quran';
	import type { SearchResult } from '$lib/types/quran';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const surahs = $derived(
		Object.entries(data.chapters)
			.map(([id, ch]) => ({ id: Number(id), ...ch }))
			.sort((a, b) => a.id - b.id)
	);

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
<div class="hero-outer relative">
	<!-- Background image -->
	<div class="hero-bg absolute inset-0 -z-10 overflow-hidden bg-base-200">
		<img src="/icons/background.svg" alt="" class="w-full" style="transform: translateY(-40%)" />
	</div>

	<div>
		<!-- Inner container -->
		<div class="mx-auto flex flex-col items-center px-2 py-5 md:py-[30px] max-w-3xl">
			<!-- Logo (hidden on mobile) -->
			<div class="hidden md:block pb-5">
				<img src="/icons/logo_main.svg" alt="Quran.com" class="h-12" />
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
				<a href="/1" class="btn btn-sm md:btn-md btn-ghost bg-base-100 rounded-full">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
					</svg>
					Navigate
				</a>
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

<!-- Surah grid -->
<main class="max-w-6xl mx-auto px-4 py-8">
	<div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
		{#each surahs as surah (surah.id)}
			<a href="/{surah.id}" class="card card-border bg-base-100 hover:bg-base-200 transition-colors p-3 gap-0.5 no-underline">
				<span class="text-xs font-bold text-base-content/40">{surah.id}</span>
				<span class="text-sm font-semibold text-base-content leading-tight">{surah.nameSimple}</span>
				<span class="text-xs text-base-content/60">{surah.translatedName.name}</span>
				<span class="text-xs text-base-content/40 mt-0.5">{surah.versesCount}v</span>
			</a>
		{/each}
	</div>
</main>
