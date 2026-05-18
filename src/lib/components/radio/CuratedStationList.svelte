<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { curatedStations, sampleTrack } from './curatedStations';
	import StationCard from './StationCard.svelte';
	import type { ActiveStation } from './types';

	interface Props {
		activeStation: ActiveStation;
		onStationChange: (station: ActiveStation) => void;
	}

	const { activeStation, onStationChange }: Props = $props();

	function isSelected(id: string) {
		return activeStation?.type === 'curated' && activeStation.id === id;
	}

	function playStation(id: string) {
		const station = curatedStations.find((item) => item.id === id);
		if (!station) return;

		if (isSelected(id) && audioState.isActive) {
			audioState.togglePlay();
			return;
		}

		const track = sampleTrack(station.tracks);
		onStationChange({ type: 'curated', id });
		audioState.playRadioStation(station.title, track.reciterId, track.chapterId);
	}
</script>

<div class="flex snap-x gap-4 overflow-x-auto px-4 pt-1 pb-2 md:px-0">
	{#each curatedStations as station (station.id)}
		<StationCard
			title={station.title}
			description={station.description}
			imageSrc={station.imageSrc}
			size="curated"
			selected={isSelected(station.id)}
			playing={isSelected(station.id) && audioState.isPlaying}
			onPlay={() => playStation(station.id)}
		/>
	{/each}
</div>
