<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const surahs = $derived(
		Object.entries(data.chapters)
			.map(([id, ch]) => ({ id: Number(id), ...ch }))
			.sort((a, b) => a.id - b.id)
	);
</script>

<svelte:head>
	<title>Quran</title>
</svelte:head>

<main>
	<header>
		<h1>القرآن الكريم</h1>
		<p>The Noble Quran</p>
	</header>

	<div class="grid">
		{#each surahs as surah (surah.id)}
			<a href="/{surah.id}" class="surah-card">
				<span class="number">{surah.id}</span>
				<span class="name">{surah.transliteratedName}</span>
				<span class="translated">{surah.translatedName}</span>
				<span class="verses">{surah.versesCount} verses</span>
			</a>
		{/each}
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	h1 {
		font-family: 'IndoPak', serif;
		font-size: 2.5rem;
		color: #111827;
		margin: 0 0 0.25rem;
	}

	header p {
		color: #6b7280;
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
	}

	.surah-card {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1rem 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		text-decoration: none;
		color: inherit;
		transition: background 0.15s, border-color 0.15s;
	}

	.surah-card:hover {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	.number {
		font-size: 0.7rem;
		font-weight: 700;
		color: #9ca3af;
	}

	.name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #111827;
	}

	.translated {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.verses {
		font-size: 0.7rem;
		color: #9ca3af;
		margin-top: 0.1rem;
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
