<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { Chapter, Verse, Pagination } from '$lib/types/quran';
	import VerseCard from './VerseCard.svelte';
	import MushafPage from './MushafPage.svelte';
	import ChapterHeader from './ChapterHeader.svelte';
	import TafsirPanel from '$lib/components/panels/TafsirPanel.svelte';

	interface Props {
		chapter: Chapter;
		verses: Verse[];
		pagination?: Pagination | null;
		page?: number;
		highlightVerseKey?: string | null;
		baseHref: string;
		onOpenTranslations?: () => void;
	}

	const {
		chapter,
		verses,
		pagination = null,
		page = 1,
		highlightVerseKey = null,
		baseHref,
		onOpenTranslations
	}: Props = $props();

	let tafsirVerseKey = $state<string | null>(null);

	function openTafsir(verseKey: string) {
		tafsirVerseKey = tafsirVerseKey === verseKey ? null : verseKey;
	}

	const mushafMode = $derived(
		readerState.readingMode === 'reading' && readerState.readingSubMode === 'arabic'
	);

	const translationPageMode = $derived(
		readerState.readingMode === 'reading' && readerState.readingSubMode === 'translation'
	);

	const initialPage = $derived(verses[0]?.pageNumber ?? 1);

	function plainText(html: string): string {
		return html.replace(/<[^>]*>/g, '').trim();
	}
</script>

<div class="quran-reader relative">
	{#if mushafMode}
		<MushafPage {initialPage} />
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
		{#if page === 1}
			<ChapterHeader
				{chapter}
				onOpenTranslations={() => onOpenTranslations?.()}
			/>
		{/if}

		<div>
			{#each verses as verse (verse.verseKey)}
				<VerseCard
					{verse}
					chapterId={Number(chapter.id)}
					chapterName={chapter.nameSimple}
					highlight={highlightVerseKey === verse.verseKey}
					onTafsir={openTafsir}
				/>
			{/each}
		</div>

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

{#if tafsirVerseKey && readerState.tafsirId}
	<TafsirPanel
		verseKey={tafsirVerseKey}
		tafsirId={readerState.tafsirId}
		onClose={() => (tafsirVerseKey = null)}
	/>
{/if}
