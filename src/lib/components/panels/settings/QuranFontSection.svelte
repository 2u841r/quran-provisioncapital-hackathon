<script lang="ts">
	import { readerState, type QuranFont } from '$lib/state/reader.svelte';
	import type { Reciter } from '$lib/types/quran';
	import ReciterSection from './ReciterSection.svelte';

	interface Props {
		reciters: Reciter[];
		onOpenReciterView: () => void;
	}

	const { reciters, onOpenReciterView }: Props = $props();

	const fontTypes = [
		{ value: 'text_uthmani' as QuranFont, label: 'Uthmani' },
		{ value: 'text_indopak' as QuranFont, label: 'IndoPak' },
		{ value: 'tajweed_v4' as QuranFont, label: 'Tajweed' }
	];

	const selectedIdx = $derived(fontTypes.findIndex((f) => f.value === readerState.quranFont));
</script>

<div id="quran-font-section" class="space-y-5">

	<!-- Font type switcher -->
	<div class="relative flex bg-base-200 rounded-lg p-0.5">
		<div
			class="absolute top-0.5 bottom-0.5 rounded-md bg-base-100 shadow-sm transition-transform duration-200 pointer-events-none"
			style="width: {100 / fontTypes.length}%; transform: translateX({(selectedIdx >= 0 ? selectedIdx : 0) * 100}%)"
		></div>
		{#each fontTypes as { value, label } (value)}
			<button
				class="flex-1 relative z-10 py-1.5 text-xs font-medium rounded-md transition-colors {readerState.quranFont === value ? 'text-base-content' : 'text-base-content/50 hover:text-base-content'}"
				onclick={() => readerState.setFont(value)}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Lines (only for IndoPak / QCF modes) -->
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-base-content/50">Lines</span>
		<div class="relative">
			<select
				class="appearance-none bg-base-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-base-content focus:outline-none focus:ring-1 focus:ring-primary"
				value={readerState.mushafLines}
				onchange={(e) => readerState.setLines(Number((e.target as HTMLSelectElement).value) as 15 | 16)}
			>
				<option value={15}>15 Lines</option>
				<option value={16}>16 Lines</option>
			</select>
			<svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>
	</div>

	<!-- Font size counter -->
	<div id="font-size-section" class="flex items-center justify-between">
		<span class="text-xs font-medium text-base-content/50">Font Size</span>
		<div class="flex items-center gap-2">
			<button
				class="btn btn-ghost btn-xs btn-circle border border-base-300"
				onclick={() => readerState.setFontScale(readerState.fontScale - 1)}
				disabled={readerState.fontScale <= 1}
				aria-label="Decrease font size"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 15 15">
					<path fill="currentColor" fill-rule="evenodd" d="M2.25 7.5a.5.5 0 0 1 .5-.5h9.5a.5.5 0 0 1 0 1h-9.5a.5.5 0 0 1-.5-.5" clip-rule="evenodd"/>
				</svg>
			</button>
			<span class="text-sm font-semibold w-4 text-center text-base-content">{readerState.fontScale}</span>
			<button
				class="btn btn-ghost btn-xs btn-circle border border-base-300"
				onclick={() => readerState.setFontScale(readerState.fontScale + 1)}
				disabled={readerState.fontScale >= 5}
				aria-label="Increase font size"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 15 15">
					<path fill="currentColor" fill-rule="evenodd" d="M8 2.75a.5.5 0 0 0-1 0V7H2.75a.5.5 0 0 0 0 1H7v4.25a.5.5 0 0 0 1 0V8h4.25a.5.5 0 0 0 0-1H8z" clip-rule="evenodd"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Reciter -->
	<ReciterSection {reciters} {onOpenReciterView} />

</div>
