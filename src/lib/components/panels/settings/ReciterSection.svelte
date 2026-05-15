<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import type { Reciter } from '$lib/types/quran';

	interface Props {
		reciters: Reciter[];
		onOpenReciterView: () => void;
	}

	const { reciters, onOpenReciterView }: Props = $props();

	const selectedReciterName = $derived(
		reciters.find((r) => r.id === audioState.reciterId)?.translatedName?.name ??
		reciters.find((r) => r.id === audioState.reciterId)?.name ??
		'Select Reciter'
	);
</script>

<div id="reciter-section">
	<button
		class="w-full flex items-center justify-between border border-base-300 rounded-xl px-3 py-3 hover:bg-base-200 transition-colors text-left"
		onclick={onOpenReciterView}
	>
		<div>
			<div class="text-[0.65rem] text-base-content/40 uppercase tracking-wide">Selected Reciter</div>
			<div class="text-sm font-medium text-base-content mt-0.5 truncate max-w-[220px]">{selectedReciterName}</div>
		</div>
		<svg class="shrink-0 text-base-content/40" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 15 15">
			<path fill="currentColor" fill-rule="evenodd" d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 1 1-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 0 1 .023-.707" clip-rule="evenodd"/>
		</svg>
	</button>
</div>
