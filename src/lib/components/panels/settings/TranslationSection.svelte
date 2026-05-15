<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { AvailableTranslation } from '$lib/types/quran';

	interface Props {
		translations: AvailableTranslation[];
		onOpenTranslationView: () => void;
	}

	const { translations, onOpenTranslationView }: Props = $props();

	const selectedCount = $derived(readerState.selectedTranslations.length);

	const selectedLabel = $derived(() => {
		if (selectedCount === 0) return 'No translation selected';
		if (selectedCount === 1) {
			const t = translations.find((t) => t.id === readerState.selectedTranslations[0]);
			return t?.translatedName?.name ?? t?.name ?? '1 translation';
		}
		return `${selectedCount} translations`;
	});
</script>

<div id="translation-section" class="space-y-4">

	<!-- Selected translations card -->
	<button
		class="w-full flex items-center justify-between border border-base-300 rounded-xl px-3 py-3 hover:bg-base-200 transition-colors text-left"
		onclick={onOpenTranslationView}
	>
		<div>
			<div class="text-[0.65rem] text-base-content/40 uppercase tracking-wide">Selected Translation</div>
			<div class="text-sm font-medium text-base-content mt-0.5 truncate max-w-[220px]">{selectedLabel()}</div>
		</div>
		<svg class="shrink-0 text-base-content/40" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 15 15">
			<path fill="currentColor" fill-rule="evenodd" d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 1 1-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 0 1 .023-.707" clip-rule="evenodd"/>
		</svg>
	</button>

	<!-- Tafsir -->
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-base-content/50">Tafsir</span>
		<div class="relative">
			<select
				class="appearance-none bg-base-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-base-content focus:outline-none focus:ring-1 focus:ring-primary max-w-[160px] truncate"
				value={readerState.tafsirId ?? ''}
				onchange={(e) => {
					const v = (e.target as HTMLSelectElement).value;
					readerState.setTafsir(v ? Number(v) : null);
				}}
			>
				<option value="">None</option>
			</select>
			<svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>
	</div>

</div>
