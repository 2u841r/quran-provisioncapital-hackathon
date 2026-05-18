<script lang="ts">
	import CuratedStationList from '$lib/components/radio/CuratedStationList.svelte';
	import ReciterStationList from '$lib/components/radio/ReciterStationList.svelte';
	import { curatedStations, sampleTrack } from '$lib/components/radio/curatedStations';
	import type { ActiveStation, RadioReciter } from '$lib/components/radio/types';
	import { audioState } from '$lib/state/audio.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();
	const reciters = $derived(data.reciters as RadioReciter[]);

	let activeStation = $state<ActiveStation>(null);

	function randomChapterId() {
		return Math.floor(Math.random() * 114) + 1;
	}

	function playNextTrack() {
		if (!activeStation) return;

		if (activeStation.type === 'curated') {
			const station = curatedStations.find((item) => item.id === activeStation?.id);
			if (!station) return;
			const track = sampleTrack(station.tracks);
			audioState.setReciter(track.reciterId);
			audioState.playVerse(`${track.chapterId}:1`, station.title);
			return;
		}

		const reciter = reciters.find((item) => item.id === activeStation?.id);
		if (!reciter) return;
		audioState.setReciter(reciter.id);
		audioState.playVerse(
			`${randomChapterId()}:1`,
			reciter.translatedName?.name ?? reciter.reciterName
		);
	}

	$effect(() => {
		if (!activeStation || audioState.status !== 'paused' || !audioState.duration) return;
		if (audioState.duration - audioState.currentTime > 0.25) return;
		playNextTrack();
	});
</script>

<svelte:head>
	<title>Quran Radio</title>
	<meta
		name="description"
		content="Listen to non-stop beautiful recitation of the Holy Quran by various reciters."
	/>
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-base-100">
	<div class="radio-flow relative mx-auto space-y-10 py-8 md:py-12">
		<section class="space-y-4">
			<div class="px-4 md:px-8">
				<h1 class="text-2xl font-semibold text-base-content">Curated Stations</h1>
			</div>
			<CuratedStationList
				{activeStation}
				onStationChange={(station) => (activeStation = station)}
			/>
		</section>

		<section class="space-y-4">
			<div class="px-4 md:px-8">
				<h2 class="text-2xl font-semibold text-base-content">Reciter Stations</h2>
			</div>
			<ReciterStationList
				{reciters}
				{activeStation}
				onStationChange={(station) => (activeStation = station)}
			/>
		</section>
	</div>
</main>

<style>
	.radio-flow {
		max-width: 80rem;
		width: 100%;
	}

	@media (min-width: 768px) {
		.radio-flow {
			max-width: min(80%, 1230px);
		}
	}
</style>
