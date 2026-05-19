<script lang="ts">
	import { untrack } from 'svelte';
	import { readerState } from '$lib/state/reader.svelte';
	import { fetchChapterVerses } from '$lib/api/quran';
	import type { Chapter, Verse, Pagination } from '$lib/types/quran';
	import VerseCard from './TranslationView/index.svelte';
	import MushafPage from './MushafPage.svelte';
	import ChapterHeader from './ChapterHeader.svelte';
	import StudyModeModal, { type StudyTab } from './StudyModeModal.svelte';
	import ChapterControls from './EndOfScrollingControls/ChapterControls.svelte';

	interface Props {
		chapter: Chapter;
		verses: Verse[];
		pagination?: Pagination | null;
		page?: number;
		highlightVerseKey?: string | null;
		baseHref: string;
		showChapterHeader?: boolean;
		onOpenTranslations?: () => void;
		onOpenSettings?: () => void;
	}

	const {
		chapter,
		verses,
		pagination = null,
		page = 1,
		highlightVerseKey = null,
		baseHref,
		showChapterHeader = true,
		onOpenTranslations,
		onOpenSettings
	}: Props = $props();

	let studyVerseKey = $state<string | null>(null);
	let studyTab = $state<StudyTab>('tafsir');

	function openStudyMode(verseKey: string, tab: StudyTab) {
		studyVerseKey = verseKey;
		studyTab = tab;
	}

	const mushafMode = $derived(
		readerState.readingMode === 'reading' && readerState.readingSubMode === 'arabic'
	);

	const translationPageMode = $derived(
		readerState.readingMode === 'reading' && readerState.readingSubMode === 'translation'
	);

	const initialPage = $derived(verses[0]?.pageNumber ?? 1);

	// ─── Infinite scroll state (verse-by-verse mode) ─────────────────────────────
	let allVerses = $state<Verse[]>([]);
	let currentPage = $state(1);
	let hasMore = $state(false);
	let loadingMore = $state(false);
	let isSentinelVisible = false;

	// Reset when chapter changes — capture all prop deps outside untrack so they
	// are tracked as reactive dependencies but applied atomically inside untrack.
	$effect(() => {
		const _verses = verses;
		const _page = page;
		// hasMore: pagination says next page exists, OR last verse isn't end of chapter (e.g. single-verse URL)
		const _hasMore =
			!!pagination?.nextPage ||
			(_verses.length > 0 && (_verses[_verses.length - 1]?.verseNumber ?? 0) < chapter.versesCount);
		// When no pagination (single verse fetch), start at page 0 so loadMore fetches page 1
		const _currentPage = pagination ? _page : 0;
		untrack(() => {
			allVerses = [..._verses];
			currentPage = _currentPage;
			hasMore = _hasMore;
			loadingMore = false;
		});
	});

	async function loadMore() {
		if (loadingMore || !hasMore) return;
		loadingMore = true;
		try {
			const nextPg = currentPage + 1;
			const res = await fetchChapterVerses(
				fetch,
				chapter.id ?? 1,
				readerState.quranFont,
				readerState.selectedTranslations,
				false,
				nextPg,
				50
			);
			// Deduplicate in case initial SSR verse overlaps with fetched page
			const existingKeys = new Set(allVerses.map((v) => v.verseKey));
			const newVerses = res.verses.filter((v) => !existingKeys.has(v.verseKey));
			allVerses = [...allVerses, ...newVerses];
			currentPage = nextPg;
			hasMore =
				!!res.pagination?.nextPage ||
				(allVerses.length > 0 &&
					(allVerses[allVerses.length - 1]?.verseNumber ?? 0) < chapter.versesCount);
		} catch (e) {
			console.error('Failed to load more verses', e);
		} finally {
			loadingMore = false;
			if (isSentinelVisible && hasMore) void loadMore();
		}
	}

	function sentinel(el: HTMLElement) {
		const observer = new IntersectionObserver(
			([entry]) => {
				isSentinelVisible = entry.isIntersecting;
				if (entry.isIntersecting) void loadMore();
			},
			{ rootMargin: '1200px 0px' }
		);
		observer.observe(el);
		return { destroy() { observer.disconnect(); } };
	}

	const showEndOfSurah = $derived(
		!hasMore && !loadingMore &&
		allVerses.length > 0 &&
		allVerses[allVerses.length - 1]?.verseNumber === chapter.versesCount
	);

	function plainText(html: string): string {
		return html.replace(/<[^>]*>/g, '').trim();
	}
</script>

<div class="quran-reader relative">
	<!-- Arabic mushaf: keep mounted so page cache survives mode switches -->
	<div class={mushafMode ? '' : 'hidden'}>
		<MushafPage {initialPage} {chapter} onOpenTranslations={() => onOpenTranslations?.()} />
	</div>

	<!-- Reading: flowing translation text -->
	<div class={translationPageMode ? '' : 'hidden'}>
		{#if showChapterHeader}
			<ChapterHeader {chapter} onOpenTranslations={() => onOpenTranslations?.()} />
		{/if}
		<div class="translation-view py-4">
			{#if chapter.bismillahPre}
				<p class="mb-4 text-center text-sm text-base-content/50 italic">
					In the Name of Allah — the Most Compassionate, Most Merciful
				</p>
			{/if}
			<p class="max-w-prose text-base leading-[2] text-base-content/80">
				{#each verses as verse (verse.verseKey)}
					{#if verse.translations?.[0]}
						<span
							class="inline cursor-pointer rounded px-0.5 transition-colors hover:bg-primary/10"
							role="button"
							tabindex="0"
							data-verse-key={verse.verseKey}
						>
							<span class="mr-0.5 align-super text-[0.7rem] font-bold text-primary/60 select-none"
								>{verse.verseNumber}</span
							>{plainText(verse.translations[0].text)}
						</span>
					{/if}
				{/each}
			</p>
		</div>
	</div>

	<!-- Verse-by-verse (default) -->
	<div class={!mushafMode && !translationPageMode ? '' : 'hidden'}>
		{#if page === 1 && showChapterHeader}
			<ChapterHeader {chapter} onOpenTranslations={() => onOpenTranslations?.()} />
		{/if}

		<div>
			{#each allVerses as verse, i (verse.verseKey)}
					<VerseCard
					{verse}
					chapterId={Number(chapter.id)}
					chapterName={chapter.nameSimple}
					highlight={highlightVerseKey === verse.verseKey}
					onStudyMode={openStudyMode}
					onOpenTranslations={() => onOpenTranslations?.()}
					onOpenSettings={() => onOpenSettings?.()}
				/>
			{/each}
		</div>

		{#if hasMore || loadingMore}
			<div use:sentinel class="h-1 w-full" aria-hidden="true"></div>
			{#if loadingMore}
				<div class="flex flex-col gap-4 px-4 py-6">
					{#each { length: 3 } as _}
						<div class="flex flex-col gap-3">
							<div class="skeleton h-4 w-full"></div>
							<div class="skeleton h-4 w-5/6"></div>
							<div class="skeleton h-4 w-4/6"></div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		{#if showEndOfSurah}
			<ChapterControls chapterId={Number(chapter.id)} chapterName={chapter.nameSimple} />
		{/if}
	</div>
</div>

<StudyModeModal
	verseKey={studyVerseKey ?? ''}
	tab={studyTab}
	open={!!studyVerseKey}
	onClose={() => (studyVerseKey = null)}
	onTabChange={(t) => (studyTab = t)}
/>
