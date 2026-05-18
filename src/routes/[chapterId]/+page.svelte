<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { readerState } from '$lib/state/reader.svelte';
	import QuranReader from '$lib/components/reader/QuranReader.svelte';
	import ReaderContextBar from '$lib/components/reader/ReaderContextBar.svelte';
	import SettingsDrawer from '$lib/components/panels/SettingsDrawer.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const { chapter, versesResponse, availableTranslations, reciters, tafsirs } = $derived(data);
	const { verses, pagination } = $derived(versesResponse);
	const pageNum = $derived(data.page);
	const startingVerse = $derived(data.startingVerse ?? 0);
	const firstVerse = $derived(verses[0] ?? null);
	const highlightVerseKey = $derived(
		startingVerse > 0 ? `${chapter.id}:${startingVerse}` : null
	);

	// Scroll to verse element if startingVerse is set
	$effect(() => {
		if (typeof window === 'undefined' || !highlightVerseKey) return;
		// Wait for DOM update
		queueMicrotask(() => {
			const el = document.querySelector(`[data-verse-key="${highlightVerseKey}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	});

	let settingsOpen = $state(false);
	let settingsInitialView = $state<'body' | 'translation'>('body');


	// Reconcile URL font with persisted readerState font on first mount.
	// Without this, opening /1 directly fetches with default font from URL even
	// when user previously chose Uthmani (code_v2) — words come back without
	// codeV2 glyphs, so VerseCard renders empty.
	$effect(() => {
		if (typeof window === 'undefined') return;
		const urlFont = page.url.searchParams.get('font');
		if (urlFont !== readerState.quranFont) {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('font', readerState.quranFont);
			params.set('lines', String(readerState.mushafLines));
			if (!params.get('translations')) {
				params.set('translations', readerState.selectedTranslations.join(','));
			}
			goto(`?${params.toString()}`, { invalidateAll: true, replaceState: true });
		}
	});

	function applySettings() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('font', readerState.quranFont);
		params.set('lines', String(readerState.mushafLines));
		params.set('translations', readerState.selectedTranslations.join(','));
		params.delete('page');
		goto(`?${params.toString()}`, { invalidateAll: true });
	}

	function handleDrawerChange() {
		if (!settingsOpen) applySettings();
	}

	function closeSettings() {
		settingsOpen = false;
		settingsInitialView = 'body';
		applySettings();
	}
</script>

<svelte:head>
	<title>Surah {chapter.nameSimple} - Quran</title>
</svelte:head>

<div class="drawer drawer-end">
	<input
		id="settings-drawer"
		type="checkbox"
		class="drawer-toggle"
		bind:checked={settingsOpen}
		onchange={handleDrawerChange}
	/>

	<div class="drawer-content flex flex-col">
		<ReaderContextBar
			{chapter}
			{firstVerse}
			onOpenSettings={() => (settingsOpen = true)}
		/>

		<main class="max-w-2xl mx-auto px-4 py-6 w-full">
			<QuranReader
				{chapter}
				{verses}
				{pagination}
				page={pageNum}
				baseHref="/{chapter.id}"
				{highlightVerseKey}
				onOpenTranslations={() => { settingsInitialView = 'translation'; settingsOpen = true; }}
				onOpenSettings={() => { settingsInitialView = 'body'; settingsOpen = true; }}
			/>
		</main>
	</div>

	<div class="drawer-side z-[60]">
		<label for="settings-drawer" class="drawer-overlay" aria-label="close"></label>
		<div class="w-80 h-screen bg-base-100 border-l border-base-200 shadow-2xl flex flex-col fixed top-0 right-0">
			<SettingsDrawer
				translations={availableTranslations}
				{reciters}
				{tafsirs}
				onClose={closeSettings}
				initialView={settingsInitialView}
				onTranslationChange={applySettings}
			/>
		</div>
	</div>
</div>
