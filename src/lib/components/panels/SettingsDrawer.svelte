<script lang="ts">
	import type { AvailableTranslation, Reciter, TafsirInfo } from '$lib/types/quran';
	import SettingsBody from './settings/SettingsBody.svelte';
	import ReciterSelectionBody from './settings/ReciterSelectionBody.svelte';
	import TranslationSelectionBody from './settings/TranslationSelectionBody.svelte';

	interface Props {
		translations: AvailableTranslation[];
		reciters: Reciter[];
		tafsirs: TafsirInfo[];
		onClose: () => void;
	}

	const { translations, reciters, tafsirs, onClose }: Props = $props();

	type SettingsView = 'body' | 'reciter' | 'translation';
	let view = $state<SettingsView>('body');

	function goBack() { view = 'body'; }

	const headerTitle: Record<SettingsView, string> = {
		body: 'Settings',
		reciter: 'Reciter',
		translation: 'Translations'
	};
</script>

<!-- Header -->
<div class="flex items-center gap-2 px-4 py-3 border-b border-base-200 shrink-0">
	{#if view !== 'body'}
		<button class="btn btn-ghost btn-sm btn-circle" onclick={goBack} aria-label="Back">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
			</svg>
		</button>
	{/if}
	<h2 class="font-semibold text-base-content flex-1">{headerTitle[view]}</h2>
	{#if view === 'body'}
		<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6 6 18M6 6l12 12"/>
			</svg>
		</button>
	{/if}
</div>

<!-- Body -->
{#if view === 'body'}
	<SettingsBody
		{translations}
		{reciters}
		onClose={() => { view = 'body'; onClose(); }}
		onOpenReciterView={() => (view = 'reciter')}
		onOpenTranslationView={() => (view = 'translation')}
	/>
{:else if view === 'reciter'}
	<ReciterSelectionBody {reciters} onSelect={goBack} />
{:else if view === 'translation'}
	<TranslationSelectionBody {translations} />
{/if}
