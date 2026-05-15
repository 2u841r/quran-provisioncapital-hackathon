<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState, fontFamilyMap } from '$lib/state/reader.svelte';
	import type { Verse } from '$lib/types/quran';

	interface Props {
		verse: Verse;
		highlight?: boolean;
		chapterName?: string;
		onTafsir?: (verseKey: string) => void;
	}

	const { verse, highlight = false, chapterName = '', onTafsir }: Props = $props();

	const isCurrentVerse = $derived(audioState.currentVerseKey === verse.verseKey);
	const isPlaying = $derived(isCurrentVerse && audioState.isPlaying);

	const arabicText = $derived(
		(verse as Record<string, unknown>)[readerState.quranFont] as string ??
		verse.textImlaeiSimple ??
		''
	);

	const fontFamily = $derived(fontFamilyMap[readerState.quranFont]);
	const fontSize = $derived(0.8 + readerState.fontScale * 0.3);

	function togglePlay() {
		if (isCurrentVerse && audioState.isActive) {
			audioState.togglePlay();
		} else {
			audioState.playVerse(verse.verseKey, chapterName);
		}
	}
</script>

<div class="verse-card border-b border-base-200 py-5 px-4 transition-colors {isCurrentVerse && audioState.isActive ? 'bg-primary/5' : highlight ? 'bg-base-200' : ''}">
	<div class="flex items-center justify-between mb-3">
		<span class="badge badge-ghost text-xs font-mono">{verse.verseKey}</span>
		<div class="flex gap-1">
			<button
				class="btn btn-ghost btn-xs btn-circle"
				class:text-primary={isCurrentVerse && audioState.isActive}
				onclick={togglePlay}
				aria-label={isPlaying ? 'Pause' : 'Play verse'}
			>
				{#if isCurrentVerse && audioState.status === 'loading'}
					<span class="loading loading-spinner loading-xs"></span>
				{:else if isPlaying}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5,3 19,12 5,21"/>
					</svg>
				{/if}
			</button>
			{#if onTafsir}
				<button
					class="btn btn-ghost btn-xs"
					onclick={() => onTafsir(verse.verseKey)}
					aria-label="View tafsir"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div
		class="text-right leading-loose mb-4"
		dir="rtl"
		lang="ar"
		style="font-family: {fontFamily}; font-size: {fontSize}rem; line-height: {2.5 + readerState.fontScale * 0.2}"
	>
		{arabicText}
	</div>

	{#if readerState.wordByWord && verse.words?.length}
		<div class="flex flex-wrap gap-1 mb-3 direction-rtl" dir="rtl">
			{#each verse.words.filter(w => w.charTypeName === 'word') as word (word.position)}
				<div class="text-center group cursor-default">
					<div class="text-base-content text-sm" dir="rtl">{word.textIndopak ?? word.textUthmani ?? word.text}</div>
					{#if word.translation}
						<div class="text-[0.65rem] text-base-content/50 group-hover:text-base-content/80 transition-colors">{word.translation.text}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if readerState.showTranslations && verse.translations?.length}
		{#each verse.translations as tr (tr.resourceId)}
			<div class="translation-block mt-2">
				{#if verse.translations.length > 1}
					<p class="text-[0.65rem] text-base-content/40 mb-0.5">{tr.resourceName}</p>
				{/if}
				<p class="text-sm leading-relaxed text-base-content/80">{@html tr.text}</p>
			</div>
		{/each}
	{/if}
</div>
