<script lang="ts">
	import VerseCard from '$lib/components/VerseCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const { chapter, verses, verseId, isRange } = $derived(data);

	const pageTitle = $derived(
		isRange
			? `Surah ${chapter.transliteratedName} ${verseId}`
			: `Surah ${chapter.transliteratedName}:${verseId}`
	);
</script>

<svelte:head>
	<title>{pageTitle} - Quran</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-8">
	<nav class="flex gap-2 items-center text-sm text-base-content/50 mb-6">
		<a href="/" class="hover:text-base-content transition-colors">Home</a>
		<span>/</span>
		<a href="/{chapter.id}" class="hover:text-base-content transition-colors">{chapter.transliteratedName}</a>
		<span>/</span>
		<span class="text-base-content">{verseId}</span>
	</nav>

	<header class="mb-6 pb-5 border-b border-base-200">
		<h1 class="text-2xl font-bold text-base-content">
			{chapter.transliteratedName}
			<span class="text-base-content/40 font-normal">{isRange ? ` (${verseId})` : `:${verseId}`}</span>
		</h1>
		<p class="font-[IndoPak] text-xl text-base-content/60 mt-1" dir="rtl">{chapter.nameArabic}</p>
	</header>

	<div>
		{#each verses as verse (verse.verseKey)}
			<VerseCard {verse} highlight={!isRange} />
		{/each}
	</div>

	<nav class="flex justify-between items-center pt-8 text-sm">
		{#if !isRange && Number(verseId) > 1}
			<a href="/{chapter.id}/{Number(verseId) - 1}" class="btn btn-sm btn-ghost">← Prev</a>
		{:else}
			<div></div>
		{/if}
		<a href="/{chapter.id}" class="btn btn-sm btn-outline">View full surah</a>
		{#if !isRange && Number(verseId) < chapter.versesCount}
			<a href="/{chapter.id}/{Number(verseId) + 1}" class="btn btn-sm btn-ghost">Next →</a>
		{:else}
			<div></div>
		{/if}
	</nav>
</main>
