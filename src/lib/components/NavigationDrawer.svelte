<script lang="ts">
	import { untrack } from 'svelte';
	import type { Chapter } from '$lib/types/quran';
	import { scrollCurrentIntoView } from '$lib/util/reader';

	interface Props {
		open: boolean;
		onClose: () => void;
		chapters: Array<Chapter & { id: number }>;
		currentChapterId?: number | null;
		currentVerseNumber?: number | null;
		currentPageNumber?: number | null;
		currentJuzNumber?: number | null;
	}

	const {
		open,
		onClose,
		chapters,
		currentChapterId = null,
		currentVerseNumber = null,
		currentPageNumber = null,
		currentJuzNumber = null
	}: Props = $props();

	let toggleEl = $state<HTMLInputElement | null>(null);

	// Force the native checkbox to mirror the `open` prop (avoid drift after close)
	$effect(() => {
		if (toggleEl) toggleEl.checked = open;
	});

	type Tab = 'surah' | 'verse' | 'juz' | 'page';
	let tab = $state<Tab>('surah');

	let surahQuery = $state('');
	let juzQuery = $state('');
	let pageQuery = $state('');
	const filteredChapters = $derived.by(() => {
		const q = surahQuery.trim().toLowerCase();
		if (!q) return chapters;
		return chapters.filter(c =>
			c.nameSimple?.toLowerCase().includes(q) ||
			c.translatedName?.name?.toLowerCase().includes(q) ||
			String(c.id) === q
		);
	});

	let verseChapter = $state(untrack(() => currentChapterId ?? 1));

	// On open, sync verseChapter to current chapter
	$effect(() => {
		if (open && currentChapterId) verseChapter = currentChapterId;
	});

	// Scroll active rows into view: 320ms wait on first open (for slide),
	// then 0ms on subsequent tab switches.
	let prevTab: Tab | '' = $state('');
	$effect(() => {
		if (!open) { prevTab = ''; return; }
		if (prevTab === tab) return;
		const firstRun = prevTab === '';
		prevTab = tab;
		scrollCurrentIntoView('.nav-panel', firstRun ? 320 : 0);
	});
	let verseSurahQuery = $state('');
	let verseVerseQuery = $state('');

	const verseSurahList = $derived.by(() => {
		const q = verseSurahQuery.trim().toLowerCase();
		if (!q) return chapters;
		return chapters.filter(c =>
			c.nameSimple?.toLowerCase().includes(q) ||
			c.translatedName?.name?.toLowerCase().includes(q) ||
			String(c.id) === q
		);
	});

	const verseList = $derived.by(() => {
		const ch = chapters.find(c => c.id === verseChapter);
		const total = ch?.versesCount ?? 0;
		const all = Array.from({ length: total }, (_, i) => i + 1);
		const q = verseVerseQuery.trim();
		if (!q) return all;
		return all.filter(n => String(n).includes(q));
	});

	const juzList = $derived.by(() => {
		const all = Array.from({ length: 30 }, (_, i) => i + 1);
		const q = juzQuery.trim();
		if (!q) return all;
		return all.filter(n => String(n).includes(q));
	});
	const pageList = $derived.by(() => {
		const all = Array.from({ length: 604 }, (_, i) => i + 1);
		const q = pageQuery.trim();
		if (!q) return all;
		return all.filter(n => String(n).includes(q));
	});

	$effect(() => {
		if (!open) {
			const t = setTimeout(() => {
				surahQuery = '';
				juzQuery = '';
				pageQuery = '';
				verseSurahQuery = '';
				verseVerseQuery = '';
				tab = 'surah';
			}, 850);
			return () => clearTimeout(t);
		}
	});

	function close() { onClose(); }
</script>

<div class="drawer nav-drawer">
	<input
		id="nav-drawer-toggle"
		type="checkbox"
		class="drawer-toggle"
		bind:this={toggleEl}
		onchange={(e) => { if (!(e.target as HTMLInputElement).checked) onClose(); }}
	/>

	<div class="drawer-side z-[20] h-full">
		<label for="nav-drawer-toggle" class="drawer-overlay" aria-label="Close navigation"></label>

		<div class="nav-panel bg-base-100 flex flex-col h-full {open ? '' : 'invisible'}">
			<!-- Header -->
			<div class="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-base-200 bg-base-100">
				<h2 class="text-sm font-semibold">Navigate Quran</h2>
				<label for="nav-drawer-toggle" class="btn btn-ghost btn-sm btn-circle" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
						<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
					</svg>
				</label>
			</div>

			<!-- Tabs + close -->
			<div class="px-3 pt-5 flex items-center gap-2">
				<div role="tablist" class="tabs tabs-box tabs-sm flex-1">
					{#each ['surah', 'verse', 'juz', 'page'] as t (t)}
						<button
							role="tab"
							class="tab flex-1 capitalize {tab === t ? 'tab-active' : ''}"
							onclick={() => (tab = t as Tab)}
						>{t}</button>
					{/each}
				</div>
				<label for="nav-drawer-toggle" class="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
						<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
					</svg>
				</label>
			</div>

			<!-- Body — flex container so child tabs can manage their own scroll -->
			<div class="flex-1 min-h-0 flex flex-col {tab === 'verse' ? '' : 'overflow-y-auto'}">
				{#if tab === 'surah'}
					<div class="p-3 sticky top-0 bg-base-100 z-[5] border-b border-base-200">
						<input
							type="search"
							placeholder="Search surah…"
							class="input input-bordered input-sm w-full"
							bind:value={surahQuery}
						/>
					</div>
					{#each filteredChapters as ch (ch.id)}
						<a
							href="/{ch.id}"
							onclick={close}
							data-current={ch.id === currentChapterId ? 'true' : undefined}
							class="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 no-underline {ch.id === currentChapterId ? 'bg-primary/10' : ''}"
						>
							<span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono shrink-0 {ch.id === currentChapterId ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'}">{ch.id}</span>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold {ch.id === currentChapterId ? 'text-primary' : 'text-base-content'} truncate">{ch.nameSimple}</div>
								<div class="text-xs text-base-content/60 truncate">{ch.translatedName.name} · {ch.versesCount} verses</div>
							</div>
							<span class="text-base text-base-content/70" dir="rtl" lang="ar" style="font-family: 'UthmanicHafs', serif;">{ch.nameArabic}</span>
						</a>
					{/each}

				{:else if tab === 'verse'}
					<div class="grid grid-cols-2 gap-0 flex-1 min-h-0">
						<!-- Surah list (left) -->
						<div class="flex flex-col border-r border-base-200 min-h-0">
							<div class="p-2 border-b border-base-200">
								<input
									type="search"
									placeholder="Search Surah"
									class="input input-bordered input-sm w-full"
									bind:value={verseSurahQuery}
								/>
							</div>
							<div class="overflow-y-auto flex-1">
								{#each verseSurahList as ch (ch.id)}
									<button
										data-current={ch.id === currentChapterId ? 'true' : undefined}
										class="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-base-200 {verseChapter === ch.id ? 'bg-primary/10 text-primary font-semibold' : ''}"
										onclick={() => { verseChapter = ch.id; verseVerseQuery = ''; }}
									>
										<span class="text-base-content/50 w-6 shrink-0">{ch.id}</span>
										<span class="truncate">{ch.nameSimple}</span>
									</button>
								{/each}
							</div>
						</div>

						<!-- Verse list (right) -->
						<div class="flex flex-col min-h-0">
							<div class="p-2 border-b border-base-200">
								<input
									type="search"
									placeholder="Verse"
									class="input input-bordered input-sm w-full"
									bind:value={verseVerseQuery}
								/>
							</div>
							<div class="overflow-y-auto flex-1">
								{#each verseList as v (v)}
									<a
										href="/{verseChapter}/{v}"
										onclick={close}
										data-current={verseChapter === currentChapterId && v === currentVerseNumber ? 'true' : undefined}
										class="block px-3 py-1.5 text-xs hover:bg-base-200 no-underline {verseChapter === currentChapterId && v === currentVerseNumber ? 'bg-primary/10 text-primary font-semibold' : 'text-base-content'}"
									>{v}</a>
								{/each}
								{#if verseList.length === 0}
									<div class="text-center text-xs text-base-content/50 py-4">No verses</div>
								{/if}
							</div>
						</div>
					</div>

				{:else if tab === 'juz'}
					<div class="p-3 sticky top-0 bg-base-100 z-[5] border-b border-base-200">
						<input
							type="search"
							placeholder="Search juz number…"
							class="input input-bordered input-sm w-full"
							bind:value={juzQuery}
						/>
					</div>
					<div class="grid grid-cols-5 gap-2 p-3">
						{#each juzList as j (j)}
							<a
								href="/juz/{j}"
								onclick={close}
								data-current={j === currentJuzNumber ? 'true' : undefined}
								class="btn btn-sm border no-underline transition-none {j === currentJuzNumber ? 'btn-primary border-primary' : 'btn-ghost border-base-300'}"
							>{j}</a>
						{/each}
						{#if juzList.length === 0}
							<div class="col-span-5 text-center text-xs text-base-content/50 py-4">No juz found</div>
						{/if}
					</div>

				{:else}
					<div class="p-3 sticky top-0 bg-base-100 z-[5] border-b border-base-200">
						<input
							type="search"
							placeholder="Search page number…"
							class="input input-bordered input-sm w-full"
							bind:value={pageQuery}
						/>
					</div>
					<div class="grid grid-cols-6 gap-1.5 p-3">
						{#each pageList as p (p)}
							<a
								href="/page/{p}"
								onclick={close}
								data-current={p === currentPageNumber ? 'true' : undefined}
								class="btn btn-xs border no-underline transition-none {p === currentPageNumber ? 'btn-primary border-primary' : 'btn-ghost border-base-300'}"
							>{p}</a>
						{/each}
						{#if pageList.length === 0}
							<div class="col-span-6 text-center text-xs text-base-content/50 py-4">No page found</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.nav-drawer {
		position: fixed;
		left: 0;
		right: 0;
		top: 4rem; /* navbar height — drawer starts below navbar */
		bottom: 0;
		z-index: 20; /* below navbar (z-30) so navbar stays on top */
		pointer-events: none;
		grid-template-columns: 1fr;
	}
	.nav-drawer .drawer-side {
		pointer-events: auto;
	}
	.nav-panel {
		width: 100vw;
	}
	@media (min-width: 768px) {
		.nav-panel {
			width: 384px;
			padding-left: 13px;
			padding-right: 13px;
		}
	}
	.nav-drawer .drawer-side > * {
		transition-property: transform !important;
		transition-duration: 280ms !important;
		transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1) !important;
	}
	/* Overlay shouldn't keep pointer cursor while closing */
	.nav-drawer .drawer-overlay { cursor: default; }
	/* Thin modern scrollbars inside the drawer */
	.nav-panel :global(.overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}
	.nav-panel :global(.overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	.nav-panel :global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}
	.nav-panel :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}
	.nav-panel :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background-color: rgba(0, 0, 0, 0.35);
	}
	:global([data-theme="dark"]) .nav-panel :global(.overflow-y-auto) {
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}
	:global([data-theme="dark"]) .nav-panel :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: rgba(255, 255, 255, 0.2);
	}
</style>
