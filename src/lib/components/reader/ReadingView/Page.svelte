<script lang="ts">
	import type { Chapter } from '$lib/types/quran';
	import type { LineMap } from './types';
	import Line from './Line.svelte';
	import PageFooter from './PageFooter.svelte';
	import ChapterHeader from '../ChapterHeader.svelte';

	// Pages that are fully center-aligned (like Al-Fatiha pages in QCF mushaf)
	const CENTER_ALIGNED_PAGES = new Set([1, 2]);
	// Specific lines on specific pages that need center alignment (short surah endings)
	const CENTER_ALIGNED_PAGE_LINES: Record<number, number[]> = {
		255: [2], 528: [9], 534: [6], 545: [6], 586: [1],
		593: [2], 594: [5], 600: [10], 602: [5, 15], 603: [10, 15],
		604: [4, 9, 14, 15],
	};

	interface Props {
		pageNumber: number;
		lineMap: LineMap;
		chapter: Chapter;
		showChapterHeader?: boolean;
		lineCount?: number;
		fontFamily: string;
		isIndoPak?: boolean;
		onOpenTranslations?: () => void;
	}

	const {
		pageNumber,
		lineMap,
		chapter,
		showChapterHeader = false,
		lineCount = 15,
		fontFamily,
		isIndoPak = false,
		onOpenTranslations
	}: Props = $props();

	const fontSize = $derived(lineCount === 15 ? '1.5rem' : '1.4rem');
	const lineHeight = $derived(lineCount === 15 ? 2.4 : 2.2);
	const lines = $derived([...lineMap.entries()]);

	function isCenterAligned(lineNum: number): boolean {
		if (isIndoPak) return false;
		if (CENTER_ALIGNED_PAGES.has(pageNumber)) return true;
		return (CENTER_ALIGNED_PAGE_LINES[pageNumber] ?? []).includes(lineNum);
	}
</script>

<div class="mushaf-page-container relative mx-auto py-6 px-4" style="max-width: 560px;">
	{#if showChapterHeader}
		<ChapterHeader {chapter} {onOpenTranslations} />
	{/if}

	<div class="mushaf-lines-container">
		{#each lines as [lineNum, words] (lineNum)}
			<Line
				lineKey="Page{pageNumber}-Line{lineNum}"
				{words}
				{fontFamily}
				{fontSize}
				{lineHeight}
				centerAlign={isCenterAligned(lineNum)}
				{isIndoPak}
			/>
		{/each}
	</div>

	<PageFooter {pageNumber} />
</div>

<!-- Hairline separator between pages -->
<div class="h-px bg-base-200 mx-4"></div>
