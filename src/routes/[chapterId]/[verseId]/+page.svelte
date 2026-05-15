<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { readerState } from '$lib/state/reader.svelte';
	import QuranReader from '$lib/components/reader/QuranReader.svelte';
	import SettingsDrawer from '$lib/components/panels/SettingsDrawer.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const { chapter, verses, verseId, isRange, availableTranslations, reciters, tafsirs } = $derived(data);

	let settingsOpen = $state(false);

	const pageTitle = $derived(
		isRange
			? `Surah ${chapter.nameSimple} ${verseId} - Quran`
			: `Surah ${chapter.nameSimple}:${verseId} - Quran`
	);

	const highlightKey = $derived(
		!isRange && verses[0] ? verses[0].verseKey : null
	);

	function applySettings() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('font', readerState.quranFont);
		params.set('translations', readerState.selectedTranslations.join(','));
		goto(`?${params.toString()}`, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-8">
	<nav class="flex gap-2 items-center text-sm text-base-content/50 mb-6">
		<a href="/" class="hover:text-base-content transition-colors">Home</a>
		<span>/</span>
		<a href="/{chapter.id}" class="hover:text-base-content transition-colors">{chapter.nameSimple}</a>
		<span>/</span>
		<span class="text-base-content">{verseId}</span>
	</nav>

	<header class="mb-6 pb-5 border-b border-base-200">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-base-content">
					{chapter.nameSimple}
					<span class="text-base-content/40 font-normal">{isRange ? ` (${verseId})` : `:${verseId}`}</span>
				</h1>
				<p class="font-[IndoPak] text-xl text-base-content/60 mt-1" dir="rtl">{chapter.nameArabic}</p>
			</div>
			<button
				class="btn btn-ghost btn-sm btn-circle"
				onclick={() => (settingsOpen = true)}
				aria-label="Reader settings"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
				</svg>
			</button>
		</div>
	</header>

	<QuranReader
		{chapter}
		{verses}
		highlightVerseKey={highlightKey}
		baseHref="/{chapter.id}/{verseId}"
	/>

	<nav class="flex justify-between items-center pt-8 text-sm">
		{#if !isRange && Number(verseId) > 1}
			<a href="/{chapter.id}/{Number(verseId) - 1}" class="btn btn-sm btn-ghost">Prev</a>
		{:else}
			<div></div>
		{/if}
		<a href="/{chapter.id}" class="btn btn-sm btn-outline">Full surah</a>
		{#if !isRange && Number(verseId) < chapter.versesCount}
			<a href="/{chapter.id}/{Number(verseId) + 1}" class="btn btn-sm btn-ghost">Next</a>
		{:else}
			<div></div>
		{/if}
	</nav>
</main>

<SettingsDrawer
	translations={availableTranslations}
	{reciters}
	{tafsirs}
	open={settingsOpen}
	onClose={() => {
		settingsOpen = false;
		applySettings();
	}}
/>
