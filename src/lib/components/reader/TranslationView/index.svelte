<script lang="ts">
	import { page } from '$app/state';
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState, fontFamilyMap } from '$lib/state/reader.svelte';
	import type { Verse } from '$lib/types/quran';
	import { fetchVerseTabCounts, type VerseTabCounts } from '$lib/api/quran';
	import type { StudyTab } from '../StudyModeModal.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import BottomActions from './BottomActions.svelte';
	import VerseText from './VerseText.svelte';
	import TranslationText from './TranslationText/index.svelte';
	import ShareVerseModal from '../ShareVerseModal.svelte';
	import WordByWordModal from './modals/WordByWordModal.svelte';
	import AdvancedCopyModal from './modals/AdvancedCopyModal.svelte';
	import RepeatVerseModal from './modals/RepeatVerseModal.svelte';
	import TranslationFeedbackModal from './modals/TranslationFeedbackModal.svelte';

	interface Props {
		verse: Verse;
		chapterName?: string;
		chapterId?: number;
		highlight?: boolean;
		onStudyMode?: (verseKey: string, tab: StudyTab) => void;
		onOpenTranslations?: () => void;
		onOpenSettings?: () => void;
	}

	const {
		verse,
		chapterName = '',
		chapterId,
		highlight = false,
		onStudyMode,
		onOpenTranslations,
		onOpenSettings
	}: Props = $props();

	let tabCounts = $state<VerseTabCounts | null>(null);
	let tabCountsFetched = false;
	function fetchTabCountsOnce() {
		if (tabCountsFetched) return;
		tabCountsFetched = true;
		fetchVerseTabCounts(fetch, verse.verseKey).then((c) => { tabCounts = c; }).catch(() => {});
	}

	// Reading history: record verse after 3s of continuous visibility (logged-in only)
	let cardEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (!cardEl || !page.data.user) return;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let recorded = false;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !recorded) {
					timer = setTimeout(() => {
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

	// Bookmark
	let bookmarked = $state(false);
	let bookmarkLoading = $state(false);
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

	// Audio
	const isCurrentVerse = $derived(audioState.currentVerseKey === verse.verseKey);
	const isPlaying = $derived(isCurrentVerse && audioState.isPlaying);
	const isAudioLoading = $derived(isCurrentVerse && audioState.status === 'loading');
	function togglePlay() {
		if (isCurrentVerse && audioState.isActive) {
			audioState.togglePlay();
		} else {
			audioState.playVerse(verse.verseKey, chapterName);
		}
	}

	// Arabic text
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
	const fontFamily = $derived(fontFamilyMap[readerState.quranFont]);
	const fontSize = $derived(0.8 + readerState.fontScale * 0.3);
	const useWordGlyphs = $derived(
		readerState.quranFont === 'code_v2' ||
		readerState.quranFont === 'code_v1' ||
		readerState.quranFont === 'tajweed_v4'
	);
	const pageNumber = $derived(verse.pageNumber ?? 1);

	// Inject QCF per-page font
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
		document.fonts.load(`1em "${fontFaceName}"`).then(() => readerState.markFontLoaded(fontFaceName)).catch(() => {});
	});

	const qcfFontKey = $derived(
		useWordGlyphs
			? `p${pageNumber}-${readerState.quranFont === 'tajweed_v4' ? 'v4' : readerState.quranFont === 'code_v1' ? 'v1' : 'v2'}`
			: ''
	);
	const isFontReady = $derived(!useWordGlyphs || readerState.loadedFontFaces.includes(qcfFontKey));

	// Copy
	async function copyVerse() {
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		await navigator.clipboard.writeText(`${arabicText}\n${trans}\n(${verse.verseKey})`);
	}

	function verseUrl(): string {
		const [c, v] = verse.verseKey.split(':');
		return `${typeof location !== 'undefined' ? location.origin : ''}/${c}/${v}`;
	}

	// Modal state
	let shareOpen = $state(false);
	let wbwOpen = $state(false);
	let advCopyOpen = $state(false);
	let repeatOpen = $state(false);
	let feedbackOpen = $state(false);
</script>

<div
	bind:this={cardEl}
	data-verse-key={verse.verseKey}
	data-page={verse.pageNumber ?? ''}
	data-juz={verse.juzNumber ?? ''}
	data-hizb={verse.hizbNumber ?? ''}
	data-chapter-id={verse.chapterId ?? chapterId ?? ''}
	class="border-b border-base-200 transition-colors {isCurrentVerse && audioState.isActive ? 'bg-base-200' : highlight ? 'bg-base-200' : ''}"
>
	<ActionButtons
		verseKey={verse.verseKey}
		verseNumber={verse.verseNumber}
		{chapterId}
		{isCurrentVerse}
		isPlaying={isPlaying}
		isLoading={isAudioLoading}
		isAudioActive={audioState.isActive}
		{bookmarked}
		{bookmarkLoading}
		onTogglePlay={togglePlay}
		onToggleBookmark={toggleBookmark}
		onCopyVerse={copyVerse}
		onShare={() => (shareOpen = true)}
		onNote={() => onStudyMode?.(verse.verseKey, 'reflections')}
		onWbw={() => (wbwOpen = true)}
		onAdvCopy={() => (advCopyOpen = true)}
		onRepeat={() => (repeatOpen = true)}
		onFeedback={() => (feedbackOpen = true)}
		{onOpenTranslations}
		{onOpenSettings}
	/>

	<div class="px-4 pb-3">
		<VerseText
			{verse}
			{arabicText}
			{fontFamily}
			{fontSize}
			{useWordGlyphs}
			{isFontReady}
		/>
		<TranslationText
			translations={verse.translations}
			showTranslations={readerState.showTranslations}
		/>
	</div>

	<div onpointerenter={fetchTabCountsOnce}>
		<BottomActions verseKey={verse.verseKey} counts={tabCounts} onTabClick={(tab) => onStudyMode?.(verse.verseKey, tab)} />
	</div>
</div>

<ShareVerseModal {verse} {arabicText} open={shareOpen} onClose={() => (shareOpen = false)} />
<WordByWordModal
	{verse}
	{fontFamily}
	{useWordGlyphs}
	{isFontReady}
	open={wbwOpen}
	onClose={() => (wbwOpen = false)}
/>
<AdvancedCopyModal
	{arabicText}
	translations={verse.translations}
	verseKey={verse.verseKey}
	open={advCopyOpen}
	onClose={() => (advCopyOpen = false)}
/>
<RepeatVerseModal
	{verse}
	{chapterName}
	{chapterId}
	open={repeatOpen}
	onClose={() => (repeatOpen = false)}
/>
<TranslationFeedbackModal
	verseKey={verse.verseKey}
	resourceName={verse.translations?.[0]?.resourceName}
	open={feedbackOpen}
	onClose={() => (feedbackOpen = false)}
/>
