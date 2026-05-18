<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState, fontFamilyMap } from '$lib/state/reader.svelte';
	import ShareVerseModal from './ShareVerseModal.svelte';
	import type { Verse } from '$lib/types/quran';
	import type { StudyTab } from './StudyModeModal.svelte';

	import pinRaw from '$lib/assets/icons/pin.svg?raw';
	import advancedCopyRaw from '$lib/assets/icons/advanced_copy.svg?raw';
	import bxBookRaw from '$lib/assets/icons/bx-book.svg?raw';
	import repeatRaw from '$lib/assets/icons/repeat-new.svg?raw';
	import translationRaw from '$lib/assets/icons/translation.svg?raw';
	import translationFeedbackRaw from '$lib/assets/icons/translation-feedback.svg?raw';
	import codeEmbedRaw from '$lib/assets/icons/code-embed.svg?raw';
	import settingsRaw from '$lib/assets/icons/settings-stroke.svg?raw';

	function svgIcon(raw: string): string {
		return raw
			.replace(/fill="(?!none)[^"]+"/g, 'fill="currentColor"')
			.replace(/stroke="(?!none|currentColor)[^"]+"/g, 'stroke="currentColor"')
			.replace(/<svg ([^>]*)>/, (_, attrs) => {
				const cleaned = attrs
					.replace(/\s*width="[^"]*"/g, '')
					.replace(/\s*height="[^"]*"/g, '')
					.replace(/\s*class="[^"]*"/g, '');
				return `<svg width="14" height="14" ${cleaned}>`;
			});
	}

	interface Props {
		verse: Verse;
		chapterName?: string;
		chapterId?: number;
		highlight?: boolean;
		onStudyMode?: (verseKey: string, tab: StudyTab) => void;
	}

	const { verse, chapterName = '', chapterId, highlight = false, onStudyMode }: Props = $props();

	let bookmarked = $state(false);
	let bookmarkLoading = $state(false);

	// Track reading history: record verse after 3s of continuous visibility
	let cardEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (!cardEl) return;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let recorded = false;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !recorded) {
					timer = setTimeout(async () => {
						recorded = true;
						fetch('/api/reading-history', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ verseKey: verse.verseKey })
						}).catch(() => {});
					}, 3000);
				} else {
					if (timer) { clearTimeout(timer); timer = null; }
				}
			},
			{ threshold: 0.6 }
		);

		observer.observe(cardEl);
		return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
	});

	async function toggleBookmark() {
		if (bookmarkLoading) return;
		bookmarkLoading = true;
		try {
			if (bookmarked) {
				await fetch('/api/bookmarks', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ verseKey: verse.verseKey })
				});
				bookmarked = false;
			} else {
				const res = await fetch('/api/bookmarks', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ verseKey: verse.verseKey })
				});
				if (res.status === 401) {
					window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
					return;
				}
				bookmarked = true;
			}
		} finally {
			bookmarkLoading = false;
		}
	}

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

	// Inject per-page QCF font via style tag; track load via Font Loading API
	$effect(() => {
		if (typeof document === 'undefined' || !useWordGlyphs) return;
		const p = pageNumber;
		const font = readerState.quranFont;
		const version = font === 'tajweed_v4' ? 'v4' : font === 'code_v1' ? 'v1' : 'v2';
		const fontFaceName = `p${p}-${version}`;
		const styleId = `qcf-${fontFaceName}`;

		if (!document.getElementById(styleId)) {
			const src = font === 'tajweed_v4'
				? `/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2`
				: `/fonts-v2/p${p}.woff2`;
			const s = document.createElement('style');
			s.id = styleId;
			s.textContent = `@font-face{font-family:${fontFaceName};src:url('${src}') format('woff2');}`;
			document.head.appendChild(s);
		}

		if (document.fonts.check(`1em "${fontFaceName}"`)) {
			readerState.markFontLoaded(fontFaceName);
			return;
		}

		document.fonts.load(`1em "${fontFaceName}"`)
			.then(() => readerState.markFontLoaded(fontFaceName))
			.catch(() => {});
	});

	const qcfFontKey = $derived(
		useWordGlyphs
			? `p${pageNumber}-${readerState.quranFont === 'tajweed_v4' ? 'v4' : readerState.quranFont === 'code_v1' ? 'v1' : 'v2'}`
			: ''
	);
	// Reads the getter directly so Svelte tracks loadedFontFaces as a reactive dependency
	const isFontReady = $derived(!useWordGlyphs || readerState.loadedFontFaces.includes(qcfFontKey));

	function toggleTab(tab: StudyTab) {
		onStudyMode?.(verse.verseKey, tab);
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

	let shareOpen = $state(false);
	let overflowOpen = $state(false);
	let wbwOpen = $state(false);
	let advCopyOpen = $state(false);
	let repeatOpen = $state(false);
	let feedbackOpen = $state(false);
	let repeatCount = $state(3);
	let advCopyFormat = $state<'arabic' | 'translation' | 'both' | 'full'>('both');
	let feedbackText = $state('');
	let feedbackSent = $state(false);

	async function copyAdvanced() {
		const arabic = arabicText;
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		let text = '';
		if (advCopyFormat === 'arabic') text = arabic;
		else if (advCopyFormat === 'translation') text = trans;
		else if (advCopyFormat === 'both') text = `${arabic}\n${trans}`;
		else text = `${arabic}\n${trans}\n(${verse.verseKey})`;
		await navigator.clipboard.writeText(text);
		advCopyOpen = false;
	}

	function startRepeat() {
		repeatOpen = false;
		let count = 0;
		function playNext() {
			if (count >= repeatCount) return;
			count++;
			audioState.playVerse(verse.verseKey, chapterName);
			const checkDone = setInterval(() => {
				if (!audioState.isPlaying) {
					clearInterval(checkDone);
					if (count < repeatCount) setTimeout(playNext, 500);
				}
			}, 500);
		}
		playNext();
	}

	function setAdvCopyFormat(v: string) {
		advCopyFormat = v as typeof advCopyFormat;
	}

	function onFeedbackInput(e: Event) {
		feedbackText = (e.target as HTMLTextAreaElement).value;
	}

	async function submitFeedback() {
		feedbackSent = true;
		setTimeout(() => { feedbackOpen = false; feedbackSent = false; feedbackText = ''; }, 1500);
	}

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
	bind:this={cardEl}
	data-verse-key={verse.verseKey}
	data-page={verse.pageNumber ?? ''}
	data-juz={verse.juzNumber ?? ''}
	data-hizb={verse.hizbNumber ?? ''}
	data-chapter-id={verse.chapterId ?? chapterId ?? ''}
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

			<!-- Bookmark -->
			<button
				class="btn btn-ghost btn-xs btn-circle {bookmarked ? 'text-warning' : 'text-base-content/40'} hover:text-warning transition-colors"
				aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark verse'}
				onclick={toggleBookmark}
				disabled={bookmarkLoading}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
				</svg>
			</button>
		</div>

		<!-- Right actions: copy, share, note, more -->
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
				onclick={() => (shareOpen = true)}
				aria-label="Share"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
					<path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
				</svg>
			</button>

			<!-- Note / Reflection -->
			<button
				class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
				onclick={() => onStudyMode?.(verse.verseKey, 'reflections')}
				aria-label="Add a note or reflection"
				title="Add a note or reflection"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
				</svg>
			</button>

			<!-- More (3-dot) -->
			<div class="relative">
				<button
					class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
					onclick={() => (overflowOpen = !overflowOpen)}
					aria-label="More actions"
					title="More"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
						<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
					</svg>
				</button>

				{#if overflowOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="fixed inset-0 z-40"
						onclick={() => (overflowOpen = false)}
						onkeydown={(e) => e.key === 'Escape' && (overflowOpen = false)}
					></div>
					<div class="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-base-300 bg-base-100 shadow-lg py-1 text-sm">
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; }}>
							<span class="shrink-0">{@html svgIcon(pinRaw)}</span>
							Pin &amp; compare
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; advCopyOpen = true; }}>
							<span class="shrink-0">{@html svgIcon(advancedCopyRaw)}</span>
							Advanced Copy
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; wbwOpen = true; }}>
							<span class="shrink-0">{@html svgIcon(bxBookRaw)}</span>
							Word By Word
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; repeatOpen = true; }}>
							<span class="shrink-0">{@html svgIcon(repeatRaw)}</span>
							Repeat Verse
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; onStudyMode?.(verse.verseKey, 'tafsir'); }}>
							<span class="shrink-0">{@html svgIcon(translationRaw)}</span>
							Translations
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; feedbackOpen = true; }}>
							<span class="shrink-0">{@html svgIcon(translationFeedbackRaw)}</span>
							Translation Feedback
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; window.open(`/${verse.verseKey.split(':')[0]}/${verse.verseKey.split(':')[1]}`, '_blank'); }}>
							<span class="shrink-0">{@html svgIcon(codeEmbedRaw)}</span>
							Embed Widget
						</button>
						<button class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors" onclick={() => { overflowOpen = false; }}>
							<span class="shrink-0">{@html svgIcon(settingsRaw)}</span>
							Settings
						</button>
					</div>
				{/if}
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
						{#if useWordGlyphs && isFontReady}
							<span style="font-family: {wordFontFamily(word)};">{wordGlyph(word)}</span>
						{:else if useWordGlyphs}
							<!-- Fallback: show readable Arabic while QCF per-page font loads -->
							<span style="font-family: 'UthmanicHafs', 'NotoNaskhArabic', serif;">{word.textUthmani ?? word.text ?? word.textImlaeiSimple ?? ''}</span>
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
				class="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2.5 text-[0.65rem] sm:text-xs shrink-0 transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5 sm:[&_svg]:w-4 sm:[&_svg]:h-4 text-base-content/50 hover:text-base-content"
				onclick={() => toggleTab(tab.id as StudyTab)}
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

<ShareVerseModal {verse} {arabicText} open={shareOpen} onClose={() => (shareOpen = false)} />

<!-- Word By Word modal -->
{#if wbwOpen}
	{@const wbwWords = verse.words.filter(w => w.charTypeName === 'word' || w.charTypeName === 'end')}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onclick={() => (wbwOpen = false)} role="dialog" aria-modal="true" aria-label="Word by word" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (wbwOpen = false)}>
		<div class="bg-base-100 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
				<h2 class="font-semibold">Word by Word — {verse.verseKey}</h2>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (wbwOpen = false)}>✕</button>
			</div>
			<div class="p-5 flex flex-col gap-6">
				<!-- Translation section -->
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-3">Word by Word Translation</p>
					<div class="flex flex-wrap gap-x-3 gap-y-4" style="direction: rtl;">
						{#each wbwWords as word (word.position)}
							{@const wbwText = useWordGlyphs ? wordGlyph(word) : wordTextContent(word)}
							{@const wbwFont = useWordGlyphs ? wordFontFamily(word) : fontFamily}
							{#if word.charTypeName === 'end'}
								<div class="flex flex-col items-center justify-start gap-0.5" style="direction: rtl;">
									<span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};">{wbwText}</span>
								</div>
							{:else}
								<div class="flex flex-col items-center gap-0.5 text-center max-w-[5rem]">
									<span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};">{wbwText}</span>
									<span class="text-[0.65rem] text-base-content/55 leading-tight w-full text-center">{word.translation?.text ?? ''}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
				<!-- Divider -->
				<div class="border-t border-base-200"></div>
				<!-- Transliteration section -->
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-3">Word by Word Transliteration</p>
					<div class="flex flex-wrap gap-x-3 gap-y-4" style="direction: rtl;">
						{#each wbwWords as word (word.position)}
							{@const wbwText = useWordGlyphs ? wordGlyph(word) : wordTextContent(word)}
							{@const wbwFont = useWordGlyphs ? wordFontFamily(word) : fontFamily}
							{#if word.charTypeName === 'end'}
								<div class="flex flex-col items-center justify-start gap-0.5" style="direction: rtl;">
									<span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};">{wbwText}</span>
								</div>
							{:else}
								<div class="flex flex-col items-center gap-0.5 text-center max-w-[5rem]">
									<span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};">{wbwText}</span>
									<span class="text-[0.65rem] text-base-content/55 leading-tight italic w-full text-center">{word.transliteration?.text ?? ''}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Advanced Copy modal -->
{#if advCopyOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onclick={() => (advCopyOpen = false)} role="dialog" aria-modal="true" aria-label="Advanced copy" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (advCopyOpen = false)}>
		<div class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
				<h2 class="font-semibold">Advanced Copy</h2>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (advCopyOpen = false)}>✕</button>
			</div>
			<div class="p-5 flex flex-col gap-2">
				{#each [
					{ v: 'arabic', label: 'Arabic only' },
					{ v: 'translation', label: 'Translation only' },
					{ v: 'both', label: 'Arabic + Translation' },
					{ v: 'full', label: 'Arabic + Translation + Key' }
				] as opt (opt.v)}
					<label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-base-200 transition-colors">
						<input type="radio" name="advCopyFormat" value={opt.v} checked={advCopyFormat === opt.v} onchange={() => setAdvCopyFormat(opt.v)} class="radio radio-primary radio-sm" />
						<span class="text-sm">{opt.label}</span>
					</label>
				{/each}
				<button class="btn btn-primary btn-sm mt-2 w-full" onclick={copyAdvanced}>Copy</button>
			</div>
		</div>
	</div>
{/if}

<!-- Repeat Verse modal -->
{#if repeatOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onclick={() => (repeatOpen = false)} role="dialog" aria-modal="true" aria-label="Repeat verse" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (repeatOpen = false)}>
		<div class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
				<h2 class="font-semibold">Repeat Verse</h2>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (repeatOpen = false)}>✕</button>
			</div>
			<div class="p-5 flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-base-content/70">Number of times</span>
					<div class="flex items-center gap-2">
						<button class="btn btn-ghost btn-sm btn-circle border border-base-300" onclick={() => (repeatCount = Math.max(1, repeatCount - 1))}>-</button>
						<span class="w-8 text-center font-bold">{repeatCount}</span>
						<button class="btn btn-ghost btn-sm btn-circle border border-base-300" onclick={() => (repeatCount = Math.min(20, repeatCount + 1))}>+</button>
					</div>
				</div>
				<div class="flex gap-2 flex-wrap">
					{#each [1, 2, 3, 5, 10] as n (n)}
						<button class="btn btn-xs rounded-full {repeatCount === n ? 'btn-primary' : 'btn-ghost border border-base-300'}" onclick={() => (repeatCount = n)}>{n}×</button>
					{/each}
				</div>
				<button class="btn btn-primary btn-sm w-full" onclick={startRepeat}>Start</button>
			</div>
		</div>
	</div>
{/if}

<!-- Translation Feedback modal -->
{#if feedbackOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onclick={() => (feedbackOpen = false)} role="dialog" aria-modal="true" aria-label="Translation feedback" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (feedbackOpen = false)}>
		<div class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
				<h2 class="font-semibold">Translation Feedback</h2>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (feedbackOpen = false)}>✕</button>
			</div>
			<div class="p-5 flex flex-col gap-3">
				{#if feedbackSent}
					<p class="text-sm text-success text-center py-4">Thank you for your feedback!</p>
				{:else}
					<p class="text-xs text-base-content/50">Verse {verse.verseKey} · {verse.translations?.[0]?.resourceName ?? 'Translation'}</p>
					<textarea
						class="textarea textarea-bordered w-full text-sm resize-none"
						rows="4"
						placeholder="Describe the issue with this translation..."
						value={feedbackText}
					oninput={onFeedbackInput}
					></textarea>
					<button class="btn btn-primary btn-sm w-full" disabled={!feedbackText.trim()} onclick={submitFeedback}>Submit</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
