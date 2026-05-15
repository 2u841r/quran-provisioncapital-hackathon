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

	const { chapter, versesResponse, availableTranslations, reciters, tafsirs } = $derived(data);
	const { verses, pagination } = $derived(versesResponse);
	const pageNum = $derived(data.page);

	let settingsOpen = $state(false);

	// Sync reader prefs to URL so server reloads with correct font/translations
	function applySettings() {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('font', readerState.quranFont);
		params.set('translations', readerState.selectedTranslations.join(','));
		params.delete('page'); // reset to page 1 when settings change
		goto(`?${params.toString()}`, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Surah {chapter.nameSimple} - Quran</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-8">
	<header class="mb-6 pb-5 border-b border-base-200">
		<div class="flex items-center gap-4 mb-1">
			<span class="text-2xl font-bold text-base-content/30">{chapter.id}</span>
			<div>
				<h1 class="text-2xl font-bold text-base-content">{chapter.nameSimple}</h1>
				<p class="text-sm text-base-content/60">{chapter.translatedName.name}</p>
			</div>
			<div class="ml-auto flex items-center gap-2">
				<div class="font-[IndoPak] text-2xl text-base-content" dir="rtl">{chapter.nameArabic}</div>
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
		</div>
		<div class="flex gap-2 text-xs text-base-content/40 mt-2">
			<span>{chapter.versesCount} verses</span>
			<span>·</span>
			<span class="capitalize">{chapter.revelationPlace}</span>
		</div>
	</header>

	<QuranReader
		{chapter}
		{verses}
		{pagination}
		page={pageNum}
		baseHref="/{chapter.id}"
	/>
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
