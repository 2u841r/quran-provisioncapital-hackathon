<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { Chapter, Verse, Pagination } from '$lib/types/quran';
	import VerseCard from './VerseCard.svelte';
	import TafsirPanel from '$lib/components/panels/TafsirPanel.svelte';

	interface Props {
		chapter: Chapter;
		verses: Verse[];
		pagination?: Pagination | null;
		page?: number;
		highlightVerseKey?: string | null;
		baseHref: string; // e.g. "/2" or "/juz/1"
	}

	const {
		chapter,
		verses,
		pagination = null,
		page = 1,
		highlightVerseKey = null,
		baseHref
	}: Props = $props();

	let tafsirVerseKey = $state<string | null>(null);

	function openTafsir(verseKey: string) {
		tafsirVerseKey = tafsirVerseKey === verseKey ? null : verseKey;
	}
</script>

<div class="quran-reader relative">
	{#if chapter.bismillahPre}
		<div
			class="text-center py-5 border-b border-base-200 text-base-content mb-1"
			dir="rtl"
			lang="ar"
			style="font-family: IndoPak, serif; font-size: 1.5rem; line-height: 3"
		>
			بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
		</div>
	{/if}

	<div>
		{#each verses as verse (verse.verseKey)}
			<VerseCard
				{verse}
				highlight={highlightVerseKey === verse.verseKey}
				onTafsir={readerState.tafsirId ? openTafsir : undefined}
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
</div>

{#if tafsirVerseKey && readerState.tafsirId}
	<TafsirPanel
		verseKey={tafsirVerseKey}
		tafsirId={readerState.tafsirId}
		onClose={() => (tafsirVerseKey = null)}
	/>
{/if}
