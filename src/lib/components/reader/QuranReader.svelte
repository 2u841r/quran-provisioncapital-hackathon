<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
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

	const isLastPage = $derived(!pagination || !pagination.nextPage);
	const lastVerse = $derived(verses[verses.length - 1] ?? null);
	const showEndOfSurah = $derived(
		isLastPage && lastVerse !== null && lastVerse.verseNumber === chapter.versesCount
	);
	function plainText(html: string): string {
		return html.replace(/<[^>]*>/g, '').trim();
	}
</script>

<div class="quran-reader relative">
	{#if mushafMode}
		<MushafPage {initialPage} {chapter} onOpenTranslations={() => onOpenTranslations?.()} />
	{:else if translationPageMode}
		<!-- Continuous flowing translation text, verse numbers inline -->
		<div class="translation-view py-4">
			{#if chapter.bismillahPre}
				<p class="text-sm text-base-content/50 text-center mb-4 italic">
					In the Name of Allah — the Most Compassionate, Most Merciful
				</p>
			{/if}
			<p class="text-base leading-[2] text-base-content/80 max-w-prose">
				{#each verses as verse (verse.verseKey)}
					{#if verse.translations?.[0]}
						<span
							class="inline cursor-pointer rounded hover:bg-primary/10 transition-colors px-0.5"
							role="button"
							tabindex="0"
							data-verse-key={verse.verseKey}
						>
							<span class="text-[0.7rem] font-bold text-primary/60 align-super mr-0.5 select-none"
								>{verse.verseNumber}</span
							>{plainText(verse.translations[0].text)}
						</span>
					{/if}
				{/each}
			</p>

			{#if pagination && pagination.totalPages > 1}
				<div class="flex justify-center items-center gap-3 pt-8">
					{#if page > 1}
						<a href="{baseHref}?page={page - 1}" class="btn btn-sm btn-ghost">← Prev</a>
					{/if}
					<span class="text-sm text-base-content/50">Page {page} / {pagination.totalPages}</span>
					{#if pagination.nextPage}
						<a href="{baseHref}?page={page + 1}" class="btn btn-sm btn-ghost">Next →</a>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		{#if page === 1 && showChapterHeader}
			<ChapterHeader
				{chapter}
				onOpenTranslations={() => onOpenTranslations?.()}
			/>
		{/if}

		<div>
			{#each verses as verse, i (verse.verseKey)}
				{#if i > 0 && verse.pageNumber && verses[i - 1].pageNumber && verse.pageNumber !== verses[i - 1].pageNumber}
					<div class="relative py-3 px-4">
						<div class="absolute inset-x-4 top-1/2 h-px bg-base-300"></div>
						<span class="relative z-10 mx-auto block w-fit bg-base-100 px-2 text-[0.65rem] text-base-content/30 select-none">
							Page {verse.pageNumber}
						</span>
					</div>
				{/if}
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

		{#if showEndOfSurah}
			<ChapterControls chapterId={Number(chapter.id)} chapterName={chapter.nameSimple} />
		{/if}

		{#if pagination && pagination.totalPages > 1}
			<div class="flex justify-center items-center gap-3 py-8">
				{#if page > 1}
					<a href="{baseHref}?page={page - 1}" class="btn btn-sm btn-ghost">← Prev</a>
				{/if}
				<span class="text-sm text-base-content/50">
					Page {page} / {pagination.totalPages}
				</span>
				{#if pagination.nextPage}
					<a href="{baseHref}?page={page + 1}" class="btn btn-sm btn-ghost">Next →</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<StudyModeModal
	verseKey={studyVerseKey ?? ''}
	tab={studyTab}
	open={!!studyVerseKey}
	onClose={() => (studyVerseKey = null)}
	onTabChange={(t) => (studyTab = t)}
/>
