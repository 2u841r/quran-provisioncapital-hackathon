<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState, fontFamilyMap } from '$lib/state/reader.svelte';
	import type { Verse } from '$lib/types/quran';

	interface Props {
		verse: Verse;
		chapterName?: string;
		chapterId?: number;
		highlight?: boolean;
		onTafsir?: (verseKey: string) => void;
	}

	const { verse, chapterName = '', chapterId, highlight = false, onTafsir }: Props = $props();

	const isCurrentVerse = $derived(audioState.currentVerseKey === verse.verseKey);
	const isPlaying = $derived(isCurrentVerse && audioState.isPlaying);
	const isLoading = $derived(isCurrentVerse && audioState.status === 'loading');

	// Map font key to camelized verse field (camelizeKeys transforms text_uthmani → textUthmani etc.)
	const fontVerseField: Record<string, keyof typeof verse> = {
		text_indopak: 'textIndopak',
		text_uthmani: 'textUthmani',
		text_uthmani_simple: 'textUthmaniSimple',
		code_v1: 'textImlaeiSimple',
		code_v2: 'textImlaeiSimple',
		tajweed_v4: 'textImlaeiSimple'
	};
	const arabicText = $derived(
		(verse[fontVerseField[readerState.quranFont] ?? 'textImlaeiSimple'] as string) ??
		verse.textImlaeiSimple ?? ''
	);

	// QCF fonts: render word-by-word glyphs per page font
	const useWordGlyphs = $derived(
		readerState.quranFont === 'code_v2' ||
		readerState.quranFont === 'code_v1' ||
		readerState.quranFont === 'tajweed_v4'
	);

	const fontFamily = $derived(fontFamilyMap[readerState.quranFont]);
	const fontSize = $derived(0.8 + readerState.fontScale * 0.3);

	const pageNumber = $derived(verse.pageNumber ?? 1);

	// Inject per-page font-face when using QCF fonts in translation view
	$effect(() => {
		if (typeof document === 'undefined' || !useWordGlyphs) return;
		const p = pageNumber;
		const font = readerState.quranFont;
		const version = font === 'tajweed_v4' ? 'v4' : font === 'code_v1' ? 'v1' : 'v2';
		const id = `qcf-p${p}-${version}`;
		if (document.getElementById(id)) return;
		const src = font === 'tajweed_v4'
			? `/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2`
			: `/fonts-v2/p${p}.woff2`;
		const s = document.createElement('style');
		s.id = id;
		s.textContent = `@font-face{font-family:p${p}-${version};src:url('${src}') format('woff2');}`;
		document.head.appendChild(s);
	});

	type Tab = 'tafsir' | 'lessons' | 'reflections' | 'answers' | 'hadith';
	let activeTab = $state<Tab | null>(null);

	function toggleTab(tab: Tab) {
		activeTab = activeTab === tab ? null : tab;
		if (tab === 'tafsir' && activeTab === 'tafsir') onTafsir?.(verse.verseKey);
		if (tab !== 'tafsir') activeTab = null; // stubs
	}

	function togglePlay() {
		if (isCurrentVerse && audioState.isActive) {
			audioState.togglePlay();
		} else {
			audioState.playVerse(verse.verseKey, chapterName);
		}
	}

	async function copyVerse() {
		const arabic = arabicText;
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		await navigator.clipboard.writeText(`${arabic}\n${trans}\n(${verse.verseKey})`);
	}

	function shareVerse() {
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		if (navigator.share) {
			navigator.share({
				title: `Quran ${verse.verseKey}`,
				text: `${arabicText}\n${trans}`
			});
		}
	}

	function wordFontFamily(word: { pageNumber?: number }): string {
		const pg = word.pageNumber ?? pageNumber;
		if (readerState.quranFont === 'code_v2') return `p${pg}-v2`;
		if (readerState.quranFont === 'code_v1') return `p${pg}-v1`;
		if (readerState.quranFont === 'tajweed_v4') return `p${pg}-v4`;
		return fontFamily;
	}

	function wordGlyph(word: { codeV2?: string; codeV1?: string }): string {
		if (readerState.quranFont === 'code_v2') return word.codeV2 ?? '';
		if (readerState.quranFont === 'code_v1') return word.codeV1 ?? '';
		if (readerState.quranFont === 'tajweed_v4') return word.codeV2 ?? ''; // v4 uses same glyph codes as v2
		return '';
	}
</script>

<div
	data-verse-key={verse.verseKey}
	class="border-b border-base-200 transition-colors {isCurrentVerse && audioState.isActive ? 'bg-primary/5' : highlight ? 'bg-base-200' : ''}"
>
	<!-- Action bar -->
	<div class="flex items-center justify-between px-4 pt-4 pb-2">
		<!-- Left actions: verse key, play, bookmark -->
		<div class="flex items-center gap-1">
			<!-- Verse key link -->
			<a
				href="/{chapterId ?? verse.chapterId}?startingVerse={verse.verseNumber}"
				class="btn btn-ghost btn-xs font-mono text-base-content/60 hover:text-primary px-2"
			>
				{verse.verseKey}
			</a>

			<!-- Play -->
			<button
				class="btn btn-ghost btn-xs btn-circle {isCurrentVerse && audioState.isActive ? 'text-primary' : 'text-base-content/50'}"
				onclick={togglePlay}
				aria-label={isPlaying ? 'Pause' : `Play verse ${verse.verseKey}`}
			>
				{#if isLoading}
					<span class="loading loading-spinner loading-xs"></span>
				{:else if isPlaying}
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
						<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m5 3 14 9-14 9z"/>
					</svg>
				{/if}
			</button>

			<!-- Bookmark (stub) -->
			<button class="btn btn-ghost btn-xs btn-circle text-base-content/40" aria-label="Bookmark">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
				</svg>
			</button>
		</div>

		<!-- Right actions: copy, share -->
		<div class="flex items-center gap-1">
			<button
				class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
				onclick={copyVerse}
				aria-label="Copy verse"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
				</svg>
			</button>

			<button
				class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
				onclick={shareVerse}
				aria-label="Share"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
					<path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Content: Arabic + Translation -->
	<div class="px-4 pb-3">
		<!-- Arabic -->
		<div class="text-right mt-[30px] md:mt-[50px] mb-4" dir="rtl" lang="ar">
			{#if verse.words?.length}
				<div
					class="flex flex-wrap justify-start gap-x-1"
					style="font-size: {fontSize}rem; line-height: {2.5 + readerState.fontScale * 0.2}"
				>
					{#each verse.words.filter(w => w.charTypeName === 'word' || w.charTypeName === 'end') as word (word.position)}
						{#if word.charTypeName === 'end'}
							<span style="font-family: 'UthmanicHafs', serif;">{word.textUthmani ?? word.text ?? ''}</span>
						{:else if useWordGlyphs}
							<span style="font-family: {wordFontFamily(word)};">{wordGlyph(word)}</span>
						{:else}
							<span style="font-family: {fontFamily};">{word.textIndopak ?? word.textUthmani ?? word.text ?? ''}</span>
						{/if}
					{/each}
				</div>
			{:else}
				<p style="font-family: {fontFamily}; font-size: {fontSize}rem; line-height: {2.5 + readerState.fontScale * 0.2}">
					{arabicText}
				</p>
			{/if}
		</div>

		<!-- Word-by-word (when enabled, non-QCF fonts) -->
		{#if readerState.wordByWord && !useWordGlyphs && verse.words?.length}
			<div class="flex flex-wrap gap-2 mb-3 justify-end" dir="rtl">
				{#each verse.words.filter(w => w.charTypeName === 'word') as word (word.position)}
					<div class="text-center">
						<div class="text-sm text-base-content" dir="rtl">{word.textIndopak ?? word.textUthmani ?? word.text}</div>
						{#if word.translation}
							<div class="text-[0.6rem] text-base-content/50">{word.translation.text}</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Translations -->
		{#if readerState.showTranslations && verse.translations?.length}
			<div class="space-y-2">
				{#each verse.translations as tr (tr.resourceId)}
					<div>
						{#if verse.translations.length > 1}
							<p class="text-[0.6rem] text-base-content/40 mb-0.5 uppercase tracking-wide">{tr.resourceName}</p>
						{/if}
						<p class="text-sm leading-relaxed text-base-content/75">{@html tr.text}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Tab bar -->
	<div class="flex items-center border-t border-base-200 overflow-x-auto">
		{#each [
			{ id: 'tafsir', label: 'Tafsirs', icon: 'book' },
			{ id: 'reflections', label: 'Reflections', icon: 'message' },
			{ id: 'hadith', label: 'Hadith', icon: 'hadith' }
		] as tab (tab.id)}
			<button
				class="flex items-center gap-1.5 px-4 py-2.5 text-xs shrink-0 border-r border-base-200 transition-colors {activeTab === tab.id ? 'text-primary bg-primary/5' : 'text-base-content/50 hover:text-base-content hover:bg-base-200'}"
				onclick={() => toggleTab(tab.id as Tab)}
				aria-label={tab.label}
			>
				{#if tab.icon === 'book'}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
					</svg>
				{:else if tab.icon === 'message'}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="none">
						<path fill="currentColor" d="M5 18.333h12.5v-1.667H5.01c-.385-.01-.843-.163-.843-.833 0-.671.458-.824.843-.834H17.5V3.333c0-.92-.747-1.667-1.667-1.667H5c-1.005 0-2.5.666-2.5 2.5v11.667c0 1.834 1.495 2.5 2.5 2.5M4.167 6.666v-2.5c0-.67.458-.823.833-.833h10.833v10H4.167z"/>
						<path fill="currentColor" d="M6.668 5h7.5v1.667h-7.5z"/>
					</svg>
				{/if}
				{tab.label}
			</button>
		{/each}
	</div>
</div>
