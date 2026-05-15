<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { AvailableTranslation, Reciter } from '$lib/types/quran';
	import SettingTabs, { type SettingsTab } from './SettingTabs.svelte';

	interface Props {
		translations: AvailableTranslation[];
		reciters: Reciter[];
		onClose: () => void;
		onOpenReciterView: () => void;
		onOpenTranslationView: () => void;
	}

	const { translations, reciters, onClose, onOpenReciterView, onOpenTranslationView }: Props = $props();

	let activeTab = $state<SettingsTab>('arabic');

	function reset() {
		readerState.setFont('text_indopak');
		readerState.setFontScale(3);
		readerState.setLines(15);
		readerState.setTranslations([131]);
		if (readerState.wordByWord) readerState.toggleWordByWord();
	}
</script>

<div class="flex flex-col flex-1 min-h-0">
	<SettingTabs
		{activeTab}
		onTabChange={(tab) => (activeTab = tab)}
		{translations}
		{reciters}
		{onOpenReciterView}
		{onOpenTranslationView}
	/>

	<div class="flex items-center gap-3 px-4 py-3 border-t border-base-200 shrink-0">
		<button class="btn btn-ghost btn-sm flex-1" onclick={reset}>Reset</button>
		<button class="btn btn-primary btn-sm flex-1" onclick={onClose}>Done</button>
	</div>
</div>
