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

	const { chapter, verses, verseId, isRange, availableTranslations, reciters, tafsirs } = $derived(data);
	const firstVerse = $derived(verses[0] ?? null);

	let settingsOpen = $state(false);

	const pageTitle = $derived(
		isRange
			? `Surah ${chapter.nameSimple} ${verseId} - Quran`
			: `Surah ${chapter.nameSimple}:${verseId} - Quran`
	);

	const highlightVerseKey = $derived(
		!isRange && verses[0] ? verses[0].verseKey : null
	);

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
		goto(`?${params.toString()}`, { invalidateAll: true });
	}

	function handleDrawerChange() {
		if (!settingsOpen) applySettings();
	}

	function closeSettings() {
		settingsOpen = false;
		applySettings();
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
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
				page={1}
				baseHref="/{chapter.id}/{verseId}"
				{highlightVerseKey}
				onOpenTranslations={() => (settingsOpen = true)}
			/>

			<!-- Prev / Next single verse nav -->
			{#if !isRange}
				<div class="flex justify-between items-center gap-3 mt-6 px-2">
					{#if Number(verseId) > 1}
						<a href="/{chapter.id}/{Number(verseId) - 1}" class="btn btn-sm btn-ghost gap-1">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
							Previous
						</a>
					{:else}
						<div></div>
					{/if}

					<a href="/{chapter.id}" class="btn btn-sm btn-ghost">View all verses</a>

					{#if Number(verseId) < chapter.versesCount}
						<a href="/{chapter.id}/{Number(verseId) + 1}" class="btn btn-sm btn-ghost gap-1">
							Next
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
						</a>
					{:else}
						<div></div>
					{/if}
				</div>
			{/if}
		</main>
	</div>

	<div class="drawer-side z-[60]">
		<label for="settings-drawer" class="drawer-overlay" aria-label="close"></label>
		<div class="w-80 min-h-full bg-base-100 border-l border-base-200 shadow-2xl flex flex-col">
			<SettingsDrawer
				translations={availableTranslations}
				{reciters}
				{tafsirs}
				onClose={closeSettings}
			/>
		</div>
	</div>
</div>
