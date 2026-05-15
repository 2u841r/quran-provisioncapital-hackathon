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

<main class="max-w-6xl mx-auto px-4 py-8">
	<header class="text-center mb-8">
		<h1 class="font-[IndoPak] text-4xl text-base-content mb-1">القرآن الكريم</h1>
		<p class="text-base-content/60">The Noble Quran</p>
	</header>

	<div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
		{#each surahs as surah (surah.id)}
			<a href="/{surah.id}" class="card card-border bg-base-100 hover:bg-base-200 transition-colors p-3 gap-0.5 no-underline">
				<span class="text-xs font-bold text-base-content/40">{surah.id}</span>
				<span class="text-sm font-semibold text-base-content leading-tight">{surah.nameSimple}</span>
				<span class="text-xs text-base-content/60">{surah.translatedName.name}</span>
				<span class="text-xs text-base-content/40 mt-0.5">{surah.versesCount}v</span>
			</a>
		{/each}
	</div>
</main>
