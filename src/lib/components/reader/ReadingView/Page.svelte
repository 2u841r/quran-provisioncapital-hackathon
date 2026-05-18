<script lang="ts">
	import type { Chapter } from '$lib/types/quran';
	import type { LineMap } from './types';
	import Line from './Line.svelte';
	import PageFooter from './PageFooter.svelte';
	import ChapterHeader from '../ChapterHeader.svelte';

	interface Props {
		pageNumber: number;
		lineMap: LineMap;
		chapter: Chapter;
		showChapterHeader?: boolean;
		lineCount?: number;
		fontFamily: string;
		onOpenTranslations?: () => void;
	}

	const {
		pageNumber,
		lineMap,
		chapter,
		showChapterHeader = false,
		lineCount = 15,
		fontFamily,
		onOpenTranslations
	}: Props = $props();

	const fontSize = $derived(lineCount === 15 ? '1.5rem' : '1.4rem');
	const lineHeight = $derived(lineCount === 15 ? 2.4 : 2.2);
	const lines = $derived([...lineMap.entries()]);
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
			/>
		{/each}
	</div>

	<PageFooter {pageNumber} />
</div>

<!-- Hairline separator between pages -->
<div class="h-px bg-base-200 mx-4"></div>
