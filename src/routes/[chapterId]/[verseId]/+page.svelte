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

<main>
	<nav class="breadcrumb">
		<a href="/{chapter.id}">{chapter.transliteratedName}</a>
		<span>/</span>
		<span>{verseId}</span>
	</nav>

	<header class="verse-header">
		<h1>
			{chapter.transliteratedName}
			<span class="verse-ref">
				{isRange ? `(${verseId})` : `:${verseId}`}
			</span>
		</h1>
		<p class="chapter-arabic" dir="rtl" lang="ar">{chapter.nameArabic}</p>
	</header>

	<div class="verses">
		{#each verses as verse (verse.verseKey)}
			<VerseCard {verse} highlight={!isRange} />
		{/each}
	</div>

	<nav class="verse-nav">
		{#if Number(verseId) > 1}
			<a href="/{chapter.id}/{Number(verseId) - 1}">← Previous verse</a>
		{/if}
		<a href="/{chapter.id}" class="surah-link">View full surah</a>
		{#if !isRange && Number(verseId) < chapter.versesCount}
			<a href="/{chapter.id}/{Number(verseId) + 1}">Next verse →</a>
		{/if}
	</nav>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.breadcrumb {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.85rem;
		color: #9ca3af;
		margin-bottom: 1.5rem;
	}

	.breadcrumb a {
		color: #059669;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.verse-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.25rem;
	}

	.verse-ref {
		color: #9ca3af;
		font-weight: 400;
	}

	.chapter-arabic {
		font-size: 1.25rem;
		font-family: 'Amiri', 'Scheherazade New', serif;
		color: #6b7280;
		margin: 0;
	}

	.verses {
		display: flex;
		flex-direction: column;
	}

	.verse-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 0;
		font-size: 0.9rem;
	}

	.verse-nav a {
		color: #059669;
		text-decoration: none;
		font-weight: 500;
	}

	.verse-nav a:hover {
		text-decoration: underline;
	}

	.surah-link {
		color: #6b7280 !important;
		font-size: 0.8rem;
	}
</style>
