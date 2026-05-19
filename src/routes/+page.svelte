<script lang="ts">
	import type { PageData } from './$types';
	import HomeHero from '$lib/components/home/HomeHero.svelte';
	import ReadingSection from '$lib/components/home/ReadingSection.svelte';
	import NavigationDrawer from '$lib/components/NavigationDrawer.svelte';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();

	const surahs = $derived(
		Object.entries(data.chapters)
			.map(([id, ch]) => ({ ...ch, id: Number(id) }))
			.sort((a, b) => a.id - b.id)
	);

	let navOpen = $state(false);
</script>

<svelte:head>
	<title>Quran</title>
	<link rel="preload" as="image" href="/images/background.png" />
</svelte:head>

<HomeHero {surahs} onNavigate={() => (navOpen = true)} />

<ReadingSection {surahs} />

<NavigationDrawer open={navOpen} onClose={() => (navOpen = false)} chapters={surahs} />
