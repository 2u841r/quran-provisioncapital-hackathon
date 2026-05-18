<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import StationCard from './StationCard.svelte';
	import type { ActiveStation, RadioReciter } from './types';

	interface Props {
		reciters: RadioReciter[];
		activeStation: ActiveStation;
		onStationChange: (station: ActiveStation) => void;
	}

	const { reciters, activeStation, onStationChange }: Props = $props();

	const localReciterImages: Record<number, string> = {
		1: '/images/reciters/1.jpg',
		2: '/images/reciters/2.jpeg',
		3: '/images/reciters/3.jpeg',
		4: '/images/reciters/4.jpg',
		5: '/images/reciters/5.jpg',
		6: '/images/reciters/6.jpg',
		7: '/images/reciters/7.jpg',
		9: '/images/reciters/9.jpg',
		10: '/images/reciters/10.jpg',
		12: '/images/reciters/12.jpg',
		161: '/images/reciters/161.jpg'
	};

	function randomChapterId() {
		return Math.floor(Math.random() * 114) + 1;
	}

	function reciterName(reciter: RadioReciter) {
		return reciter.translatedName?.name ?? reciter.reciterName;
	}

	function reciterStyle(reciter: RadioReciter) {
		return typeof reciter.style === 'string' ? reciter.style : reciter.style?.name;
	}

	function reciterImage(reciter: RadioReciter) {
		return reciter.profilePicture ?? localReciterImages[reciter.id];
	}

	function isSelected(id: number) {
		return activeStation?.type === 'reciter' && activeStation.id === id;
	}

	function playReciter(reciter: RadioReciter) {
		if (isSelected(reciter.id) && audioState.isActive) {
			audioState.togglePlay();
			return;
		}

		onStationChange({ type: 'reciter', id: reciter.id });
		audioState.playRadioStation(reciterName(reciter), reciter.id, randomChapterId(), reciterStyle(reciter) ?? '');
	}
</script>

<div class="reciter-grid px-4 md:px-8">
	{#each reciters as reciter (reciter.id)}
		<StationCard
			title={reciterName(reciter)}
			description={reciterStyle(reciter)}
			imageSrc={reciterImage(reciter)}
			selected={isSelected(reciter.id)}
			playing={isSelected(reciter.id) && audioState.isPlaying}
			onPlay={() => playReciter(reciter)}
		/>
	{/each}
</div>

<style>
	.reciter-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.reciter-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1024px) {
		.reciter-grid {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
	}
</style>
