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

	// Returns display text for a regular (non-end) word based on selected font.
	// For IndoPak last word, strip the embedded ornate end marker so we can render a plain CSS circle instead.
	function wordTextContent(word: { text?: string; textIndopak?: string; textUthmani?: string }, stripEnd = false): string {
		const text = readerState.quranFont === 'text_indopak'
			? (word.textIndopak ?? word.text ?? '')
			: (word.text ?? word.textUthmani ?? '');
		if (!stripEnd) return text;
		// Strip Arabic end-of-ayah / small high mark sequences at the end
		return text.replace(/[۔-ۭ][٠-٩\d]*\s*$/u, '').trimEnd();
	}

	const lastEndPosition = $derived(
		verse.words.filter(w => w.charTypeName === 'end').at(-1)?.position ?? -1
	);

	function ayahMarker(verseNumber: number): string {
		const digits = String(verseNumber).replace(/\d/g, d => String.fromCharCode(0x0660 + Number(d)));
		return '۝' + digits;
	}

	function toArabicNumerals(n: number): string {
		return String(n).replace(/\d/g, d => String.fromCharCode(0x0660 + Number(d)));
	}

	// Waqf indicators for IndoPak: all 'end' words except the last one (the ayah marker itself)
	const waqfIndicators = $derived.by(() => {
		const ends = verse.words.filter(w => w.charTypeName === 'end');
		return ends.slice(0, -1).map(w => w.textIndopak ?? w.text ?? '').join('');
	});

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

	let shareCopied = $state(false);

	function verseUrl(): string {
		const [c, v] = verse.verseKey.split(':');
		return `${typeof location !== 'undefined' ? location.origin : ''}/${c}/${v}`;
	}

	async function copyVerseLink() {
		await navigator.clipboard.writeText(verseUrl());
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 1500);
	}

	async function copyVerseText() {
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		await navigator.clipboard.writeText(`${arabicText}\n${trans}\n(${verse.verseKey})`);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 1500);
	}

	async function nativeShare() {
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		if (navigator.share) {
			await navigator.share({
				title: `Quran ${verse.verseKey}`,
				text: `${arabicText}\n${trans}`,
				url: verseUrl()
			}).catch(() => {});
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

			<div class="dropdown dropdown-end">
				<button
					tabindex="0"
					class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
					aria-label="Share"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
					<path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
				</svg>
			</button>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-30 w-56 p-2 shadow border border-base-200 mt-1">
				{#if shareCopied}
					<li class="menu-title text-success text-[0.65rem]">Copied to clipboard</li>
				{/if}
				<li>
					<button onclick={copyVerseLink}>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
						</svg>
						Copy link
					</button>
				</li>
				<li>
					<button onclick={copyVerseText}>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
						</svg>
						Copy text
					</button>
				</li>
				{#if typeof navigator !== 'undefined' && navigator.share}
					<li>
						<button onclick={nativeShare}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
								<path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
							</svg>
							Share via…
						</button>
					</li>
				{/if}
				<li>
					<a href="https://twitter.com/intent/tweet?text={encodeURIComponent(`Quran ${verse.verseKey}`)}&url={encodeURIComponent(verseUrl())}" target="_blank" rel="noreferrer">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8a8.5 8.5 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74A11.64 11.64 0 0 1 3.39 4.62a4.16 4.16 0 0 0-.55 2.07A4.1 4.1 0 0 0 4.68 10a4.1 4.1 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 4.1 4.1 0 0 1-1.85.07 4.11 4.11 0 0 0 3.83 2.85A8.22 8.22 0 0 1 2 18.13a11.59 11.59 0 0 0 6.29 1.84c7.55 0 11.67-6.25 11.67-11.67v-.53A8.43 8.43 0 0 0 22 5.8z"/></svg>
						Share on X
					</a>
				</li>
				<li>
					<a href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(verseUrl())}" target="_blank" rel="noreferrer">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.79c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>
						Share on Facebook
					</a>
				</li>
				<li>
					<a href="https://wa.me/?text={encodeURIComponent(`Quran ${verse.verseKey} ${verseUrl()}`)}" target="_blank" rel="noreferrer">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.45A11.85 11.85 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.56 4.18 1.62 6L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.18-1.25-6.18-3.48-8.55zM12 21.83a9.83 9.83 0 0 1-5-1.36l-.36-.21-3.66.96.98-3.57-.24-.37A9.83 9.83 0 1 1 12 21.83zm5.39-7.36c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07a8.06 8.06 0 0 1-2.37-1.46 8.92 8.92 0 0 1-1.64-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.21 5.09 4.5.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>
						WhatsApp
					</a>
				</li>
			</ul>
		</div>
	</div>
	</div>

	<!-- Content: Arabic + Translation -->
	<div class="px-4 pb-3">
		<!-- Arabic -->
		<div class="text-right mt-2 md:mt-3 mb-3" dir="rtl" lang="ar">
			{#if verse.words?.length}
				{@const isIndoPak = readerState.quranFont === 'text_indopak'}
				{@const renderedWords = useWordGlyphs
					? verse.words.filter(w => w.charTypeName !== 'pause')
					: verse.words.filter(w => w.charTypeName === 'word')}
				<div
					class="flex flex-wrap justify-start gap-x-1 items-baseline"
					style="font-size: {fontSize}rem; line-height: {2.5 + readerState.fontScale * 0.2}"
				>
					{#each renderedWords as word, i (word.position)}
						{#if useWordGlyphs}
							<span style="font-family: {wordFontFamily(word)};">{wordGlyph(word)}</span>
						{:else}
							<!-- Strip embedded end marker only from the last word in IndoPak -->
							<span style="font-family: {fontFamily};">{wordTextContent(word, isIndoPak && i === renderedWords.length - 1)}</span>
						{/if}
					{/each}
					<!-- IndoPak: plain CSS circle with Arabic-Indic verse number + waqf indicators stacked above -->
					{#if isIndoPak}
						<span class="relative inline-block" style="width: 1.6em; height: 1.6em; font-size: 0.55em; transform: translateY(7px);">
							<span class="absolute inset-0 flex items-center justify-center rounded-full border border-current" style="border-width: 1.5px; line-height: 1;">
								<span style="font-size: 0.7em;">{toArabicNumerals(verse.verseNumber)}</span>
							</span>
							{#if waqfIndicators}
								<span
									class="absolute left-0 right-0 text-center"
									style="bottom: 95%; font-family: {fontFamily}; font-size: 1.3em; line-height: 1; transform: translateX(-0.4em);"
								>{waqfIndicators}</span>
							{/if}
						</span>
					{/if}
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
	<div class="flex items-center justify-between border-t border-base-200 px-1 sm:px-2">
		{#each [
			{ id: 'tafsir', label: 'Tafsirs' },
			{ id: 'lessons', label: 'Lessons' },
			{ id: 'reflections', label: 'Reflections' },
			{ id: 'answers', label: 'Answers' }
		] as tab, i (tab.id)}
			{#if i > 0}
				<div class="h-3.5 w-px bg-base-300 shrink-0"></div>
			{/if}
			<button
				class="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2.5 text-[0.65rem] sm:text-xs shrink-0 transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5 sm:[&_svg]:w-4 sm:[&_svg]:h-4 {activeTab === tab.id ? 'text-primary' : 'text-base-content/50 hover:text-base-content'}"
				onclick={() => toggleTab(tab.id as Tab)}
				aria-label={tab.label}
				data-testid="bottom-action-tab-{tab.id}"
			>
				{#if tab.id === 'tafsir'}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
					</svg>
				{:else if tab.id === 'lessons'}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
						<path fill="currentColor" d="M5.434 13.804 10 16.484l4.566-2.68V10.91l1.534-.89v4.74l-6.1 3.58-6.1-3.58v-4.74l1.534.89zM2.888 6.548 10 10.58l7.112-4.032L10 2.786zM19.1 11.545h-1.486V7.993l-7.614 4.317-9.05-5.13V5.896l9.05-4.79 9.1 4.79z"/>
					</svg>
				{:else if tab.id === 'reflections'}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 21" fill="none">
						<path fill="currentColor" d="M17.01 9.419s1.75-.895 2.629 0a1.277 1.277 0 0 1 0 1.784c-.878.89-2.628 0-2.628 0zm-16.645 0c.876-.895 2.628 0 2.628 0v1.784s-1.75.89-2.628 0a1.28 1.28 0 0 1 0-1.784M10.878.496c.573.585 0 2.677 0 2.677H9.126S8.64.992 9.126.496a1.22 1.22 0 0 1 1.752 0m-7.079 2.23c1.075 0 1.866 1.91 1.866 1.91L4.421 5.894s-1.866-.937-1.866-1.891c0-.703.555-1.276 1.244-1.276m10.54 1.901s.92-1.9 1.857-1.9c.692 0 1.252.57 1.252 1.276 0 1.06-1.866 1.891-1.866 1.891zm-4.337.33c1.394 0 2.73.564 3.717 1.568a5.4 5.4 0 0 1 1.54 3.786c0 1.98-1.06 3.712-2.629 4.64v1.606a.9.9 0 0 1-.257.63.87.87 0 0 1-.619.262H8.25a.87.87 0 0 1-.62-.261.9.9 0 0 1-.256-.631V14.95a5.38 5.38 0 0 1-2.629-4.64c0-1.42.554-2.782 1.54-3.786a5.2 5.2 0 0 1 3.717-1.568"/>
					</svg>
				{/if}
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>
</div>
