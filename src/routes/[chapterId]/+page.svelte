<script lang="ts">
	import VerseCard from '$lib/components/VerseCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const { chapter, versesResponse, page } = $derived(data);
	const { verses, pagination } = $derived(versesResponse);
</script>

<svelte:head>
	<title>Surah {chapter.transliteratedName} ({chapter.nameArabic}) - Quran</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-8">
	<header class="mb-6 pb-5 border-b border-base-200">
		<div class="flex items-center gap-4 mb-1">
			<span class="text-2xl font-bold text-base-content/30">{chapter.id}</span>
			<div>
				<h1 class="text-2xl font-bold text-base-content">{chapter.transliteratedName}</h1>
				<p class="text-sm text-base-content/60">{chapter.translatedName}</p>
			</div>
			<div class="ml-auto font-[IndoPak] text-2xl text-base-content" dir="rtl">{chapter.nameArabic}</div>
		</div>
		<div class="flex gap-2 text-xs text-base-content/40 mt-2">
			<span>{chapter.versesCount} verses</span>
			<span>·</span>
			<span class="capitalize">{chapter.revelationPlace}</span>
		</div>
	</header>

	{#if chapter.bismillahPre}
		<div class="text-center font-[IndoPak] text-2xl py-4 mb-2 border-b border-base-200 text-base-content" dir="rtl" lang="ar">
			بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
		</div>
	{/if}

	<div>
		{#each verses as verse (verse.verseKey)}
			<VerseCard {verse} />
		{/each}
	</div>

	{#if pagination.totalPages > 1}
		<div class="flex justify-center items-center gap-4 py-8">
			{#if page > 1}
				<a href="/{chapter.id}?page={page - 1}" class="btn btn-sm btn-ghost">← Prev</a>
			{/if}
			<span class="text-sm text-base-content/60">Page {page} of {pagination.totalPages}</span>
			{#if pagination.nextPage}
				<a href="/{chapter.id}?page={page + 1}" class="btn btn-sm btn-ghost">Next →</a>
			{/if}
		</div>
	{/if}
</main>
