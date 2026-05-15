<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import type { Reciter } from '$lib/types/quran';

	interface Props {
		reciters: Reciter[];
		onSelect: () => void;
	}

	const { reciters, onSelect }: Props = $props();
</script>

<div class="flex-1 overflow-y-auto">
	{#each reciters as r (r.id)}
		<button
			class="w-full text-left px-4 py-3 text-sm border-b border-base-200 transition-colors {audioState.reciterId === r.id ? 'text-primary font-medium bg-primary/5' : 'text-base-content hover:bg-base-200'}"
			onclick={() => { audioState.setReciter(r.id); onSelect(); }}
		>
			{r.translatedName?.name ?? r.reciterName}
		</button>
	{/each}
</div>
