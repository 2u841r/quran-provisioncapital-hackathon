<script lang="ts">
	import type { Chapter } from '$lib/types/quran';

	interface Props {
		open: boolean;
		onClose: () => void;
		chapters: Array<Chapter & { id: number }>;
	}

	const { open, onClose, chapters }: Props = $props();

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

	let verseChapter = $state(1);
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
		checked={open}
		onchange={(e) => { if (!(e.target as HTMLInputElement).checked) onClose(); }}
	/>

	<div class="drawer-side z-[20]">
		<label for="nav-drawer-toggle" class="drawer-overlay" aria-label="Close navigation"></label>

		<div class="nav-panel bg-base-100 flex flex-col {open ? '' : 'invisible'}" style="height: calc(100vh - 4rem);">
			<!-- Header -->
			<div class="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-base-200 bg-base-100">
				<h2 class="text-sm font-semibold">Navigate Quran</h2>
				<label for="nav-drawer-toggle" class="btn btn-ghost btn-sm btn-circle" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
						<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
					</svg>
				</label>
			</div>

			<!-- Tabs -->
			<div class="px-3 pt-5">
				<div role="tablist" class="tabs tabs-box tabs-sm w-full">
					{#each ['surah', 'verse', 'juz', 'page'] as t (t)}
						<button
							role="tab"
							class="tab flex-1 capitalize {tab === t ? 'tab-active' : ''}"
							onclick={() => (tab = t as Tab)}
						>{t}</button>
					{/each}
				</div>
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
										class="block px-3 py-1.5 text-xs hover:bg-base-200 text-base-content no-underline"
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
								class="btn btn-sm btn-ghost border border-base-300 no-underline"
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
								class="btn btn-xs btn-ghost border border-base-300 no-underline"
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
		transition-duration: 800ms !important;
		transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1) !important;
	}
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
