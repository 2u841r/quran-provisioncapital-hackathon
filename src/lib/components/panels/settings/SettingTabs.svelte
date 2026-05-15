<script lang="ts">
	import type { AvailableTranslation, Reciter } from '$lib/types/quran';
	import VersePreview from './VersePreview.svelte';
	import QuranFontSection from './QuranFontSection.svelte';
	import TranslationSection from './TranslationSection.svelte';
	import WordByWordSection from './WordByWordSection.svelte';

	export type SettingsTab = 'arabic' | 'translation' | 'wbw';

	interface Props {
		activeTab: SettingsTab;
		onTabChange: (tab: SettingsTab) => void;
		translations: AvailableTranslation[];
		reciters: Reciter[];
		onOpenReciterView: () => void;
		onOpenTranslationView: () => void;
	}

	const { activeTab, onTabChange, translations, reciters, onOpenReciterView, onOpenTranslationView }: Props = $props();

	const tabs: { id: SettingsTab; label: string }[] = [
		{ id: 'arabic', label: 'Arabic' },
		{ id: 'translation', label: 'Translation' },
		{ id: 'wbw', label: 'Word By Word' }
	];
</script>

<div class="flex flex-col flex-1 min-h-0">
	<!-- Tab list -->
	<div role="tablist" class="flex border-b border-base-200 shrink-0">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				class="flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 {activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content'}"
				onclick={() => onTabChange(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Scrollable area with preview + content -->
	<div class="flex-1 overflow-y-auto">
		<!-- Verse preview (always visible) -->
		<div class="mx-4 mt-4 mb-3 border border-base-200 rounded-xl p-3 bg-base-200/30">
			<VersePreview />
		</div>

		<!-- Tab panels -->
		<div class="px-4 pb-4">
			{#if activeTab === 'arabic'}
				<QuranFontSection {reciters} {onOpenReciterView} />
			{:else if activeTab === 'translation'}
				<TranslationSection {translations} {onOpenTranslationView} />
			{:else}
				<WordByWordSection />
			{/if}
		</div>
	</div>
</div>
