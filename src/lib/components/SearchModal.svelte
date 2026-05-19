<script lang="ts">
	import { fetchSearch, getChaptersData } from '$lib/api/quran';
	import type { SearchResult } from '$lib/types/quran';
	import VoiceSearch from '$lib/components/VoiceSearch.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	const { open, onClose }: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let searchToggleEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (searchToggleEl) searchToggleEl.checked = open;
	});

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const chaptersData = $derived(() => {
		try { return getChaptersData(); } catch { return {}; }
	});
	const chapterMatches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		const list = Object.entries(chaptersData() as Record<string, any>).map(([id, ch]) => ({
			id: Number(id),
			...ch
		}));
		return list.filter(s =>
			s.nameSimple?.toLowerCase().includes(q) ||
			s.nameArabic?.includes(q) ||
			s.translatedName?.name?.toLowerCase().includes(q) ||
			String(s.id) === q
		).slice(0, 5);
	});

	type NavHint = { label: string; href: string; kind: 'page' | 'juz' | 'verse' };
	const navHints = $derived.by((): NavHint[] => {
		const q = query.trim();
		if (!q) return [];
		const out: NavHint[] = [];
		const pageMatch = q.match(/^\s*page\s+(\d{1,3})\s*$/i);
		if (pageMatch && Number(pageMatch[1]) >= 1 && Number(pageMatch[1]) <= 604) {
			out.push({ label: `Go to Page ${pageMatch[1]}`, href: `/page/${pageMatch[1]}`, kind: 'page' });
		}
		const juzMatch = q.match(/^\s*juz\s+(\d{1,2})\s*$/i);
		if (juzMatch && Number(juzMatch[1]) >= 1 && Number(juzMatch[1]) <= 30) {
			out.push({ label: `Go to Juz ${juzMatch[1]}`, href: `/juz/${juzMatch[1]}`, kind: 'juz' });
		}
		const verseMatch = q.match(/^\s*(\d{1,3})\s*:\s*(\d{1,3})\s*$/);
		if (verseMatch) {
			out.push({ label: `Go to verse ${verseMatch[1]}:${verseMatch[2]}`, href: `/${verseMatch[1]}/${verseMatch[2]}`, kind: 'verse' });
		}
		return out;
	});

	$effect(() => {
		if (open) {
			queueMicrotask(() => inputEl?.focus());
		} else {
			// Wait for the slide-out animation, then reset state
			if (debounceTimer) clearTimeout(debounceTimer);
			loading = false;
			const t = setTimeout(() => {
				query = '';
				results = [];
			}, 850);
			return () => clearTimeout(t);
		}
	});

	function setQuery(q: string) {
		query = q;
		if (inputEl) inputEl.value = q;
		onInput({ target: { value: q } } as unknown as Event);
	}

	function onInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
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

	function handleResultClick() {
		onClose();
	}
</script>

<!-- DaisyUI drawer-end, fixed positioned via .search-drawer -->
<div class="drawer drawer-end search-drawer">
	<input
		id="search-drawer-toggle"
		type="checkbox"
		class="drawer-toggle"
		bind:this={searchToggleEl}
		onchange={(e) => {
			if (!(e.target as HTMLInputElement).checked) onClose();
		}}
	/>

	<div class="drawer-side z-[70]">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
		<label for="search-drawer-toggle" class="drawer-overlay" aria-label="Close search"></label>

		<div class="search-panel bg-base-100 min-h-full flex flex-col">
			<!-- Search header -->
			<div class="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-base-200 bg-base-100">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50">
					<circle cx="11" cy="11" r="8"/>
					<path d="m21 21-4.3-4.3"/>
				</svg>
				<input
					bind:this={inputEl}
					type="search"
					placeholder="Search the Quran"
					class="grow bg-transparent outline-none text-sm"
					value={query}
					oninput={onInput}
				/>
				<VoiceSearch onTranscript={setQuery} />
				{#if loading}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
				<label for="search-drawer-toggle" class="btn btn-ghost btn-sm btn-circle" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
						<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
					</svg>
				</label>
			</div>

			<!-- Body (hidden during close so popular/results don't flash) -->
			<div class="flex-1 overflow-y-auto {open ? '' : 'invisible'}">
				{#if !query.trim()}
					<div class="py-4">
						<div class="px-4 pb-2 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold">Popular</div>
						{#each [
							{ name: 'Surah Mulk', id: 67 },
							{ name: 'Surah Noah', id: 71 },
							{ name: 'Surah Al-Kahf', id: 18 },
							{ name: 'Surah Yaseen', id: 36 }
						] as item (item.id)}
							<a
								href="/{item.id}"
								onclick={handleResultClick}
								class="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 no-underline"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-base-content/60">
									<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
									<polyline points="17 6 23 6 23 12"/>
								</svg>
								<span class="text-sm text-base-content">{item.name}</span>
							</a>
						{/each}

						<div class="px-4 pt-4 pb-2 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold border-t border-base-200 mt-2">Try searching for</div>
						{#each [
							{ label: 'Juz 1', q: 'Juz 1' },
							{ label: 'Page 1', q: 'Page 1' },
							{ label: 'Yaseen', q: 'Yaseen' },
							{ label: '36', q: '36' },
							{ label: '2:255', q: '2:255' }
						] as hint (hint.label)}
							<button
								onclick={() => { query = hint.q; onInput({ target: { value: hint.q } } as unknown as Event); }}
								class="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-base-200"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50">
									<circle cx="11" cy="11" r="8"/>
									<path d="m21 21-4.3-4.3"/>
								</svg>
								<span class="text-sm text-base-content/80">{hint.label}</span>
							</button>
						{/each}
					</div>
				{:else}
					{#if navHints.length > 0}
						<div class="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold">Go to</div>
						{#each navHints as nh (nh.href)}
							<a
								href={nh.href}
								onclick={handleResultClick}
								class="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 no-underline"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
									<line x1="5" y1="12" x2="19" y2="12"/>
									<polyline points="12 5 19 12 12 19"/>
								</svg>
								<span class="text-sm text-base-content">{nh.label}</span>
							</a>
						{/each}
					{/if}

					{#if chapterMatches.length > 0}
						<div class="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wide text-base-content/40 font-semibold">Surahs</div>
						{#each chapterMatches as ch (ch.id)}
							<a
								href="/{ch.id}"
								onclick={handleResultClick}
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
								href="/{r.verseKey.split(':')[0]}/{r.verseKey.split(':')[1]}"
								onclick={handleResultClick}
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
					{:else if !loading && !chapterMatches.length && !navHints.length}
						<div class="p-6 text-center text-sm text-base-content/50">No results</div>
					{:else if loading}
						<div class="p-6 text-center text-sm text-base-content/50">Searching…</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Make the drawer behave as a fixed-position overlay (not part of layout flow) */
	.search-drawer {
		position: fixed;
		inset: 0;
		z-index: 70;
		pointer-events: none;
		grid-template-columns: 1fr;
	}
	.search-drawer .drawer-side {
		pointer-events: auto;
	}
	.search-panel {
		width: 100vw;
	}
	.search-drawer .drawer-side > * {
		transition-property: transform !important;
		transition-duration: 280ms !important;
		transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1) !important;
	}
	.search-drawer .drawer-overlay { cursor: default; }
	@media (min-width: 768px) {
		.search-panel {
			width: 384px;
			padding-left: 13px;
			padding-right: 13px;
		}
	}
</style>
