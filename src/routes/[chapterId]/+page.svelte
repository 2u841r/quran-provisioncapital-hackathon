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
	<meta
		name="description"
		content="Read Surah {chapter.transliteratedName} - {chapter.translatedName}, {chapter.versesCount} verses"
	/>
</svelte:head>

<main>
	<header class="chapter-header">
		<div class="chapter-meta">
			<span class="chapter-id">{chapter.id}</span>
			<div>
				<h1>{chapter.transliteratedName}</h1>
				<p class="translated-name">{chapter.translatedName}</p>
			</div>
			<div class="arabic-name" dir="rtl">{chapter.nameArabic}</div>
		</div>
		<div class="chapter-info">
			<span>{chapter.versesCount} verses</span>
			<span class="dot">·</span>
			<span class="revelation-place">{chapter.revelationPlace}</span>
		</div>
	</header>

	{#if chapter.bismillahPre}
		<div class="bismillah" dir="rtl" lang="ar">
			بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
		</div>
	{/if}

	<div class="verses">
		{#each verses as verse (verse.verseKey)}
			<VerseCard {verse} />
		{/each}
	</div>

	{#if pagination.totalPages > 1}
		<nav class="pagination">
			{#if page > 1}
				<a href="/{chapter.id}?page={page - 1}">Previous</a>
			{/if}
			<span>Page {page} of {pagination.totalPages}</span>
			{#if pagination.nextPage}
				<a href="/{chapter.id}?page={page + 1}">Next</a>
			{/if}
		</nav>
	{/if}
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.chapter-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.chapter-meta {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.chapter-id {
		font-size: 1.5rem;
		font-weight: 700;
		color: #9ca3af;
		min-width: 2.5rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.translated-name {
		font-size: 0.9rem;
		color: #6b7280;
		margin: 0.1rem 0 0;
	}

	.arabic-name {
		font-size: 1.75rem;
		font-family: 'Amiri', 'Scheherazade New', serif;
		color: #111827;
		margin-left: auto;
	}

	.chapter-info {
		font-size: 0.85rem;
		color: #9ca3af;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.revelation-place {
		text-transform: capitalize;
	}

	.bismillah {
		text-align: center;
		font-size: 1.5rem;
		font-family: 'Amiri', 'Scheherazade New', serif;
		padding: 1.5rem;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
	}

	.verses {
		display: flex;
		flex-direction: column;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem 0;
		font-size: 0.9rem;
	}

	.pagination a {
		color: #059669;
		text-decoration: none;
		font-weight: 500;
	}

	.pagination a:hover {
		text-decoration: underline;
	}
</style>
