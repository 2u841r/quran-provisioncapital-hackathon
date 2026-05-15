<script lang="ts">
	import { fetchTafsirContent } from '$lib/api/quran';
	import type { TafsirContent } from '$lib/types/quran';

	interface Props {
		verseKey: string;
		tafsirId: number;
		onClose: () => void;
	}

	const { verseKey, tafsirId, onClose }: Props = $props();

	let content = $state<TafsirContent | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		// Re-fetch when verseKey or tafsirId changes
		const key = verseKey;
		const id = tafsirId;
		content = null;
		error = null;
		loading = true;
		fetchTafsirContent(fetch, id, key)
			.then((c) => { content = c; })
			.catch(() => { error = 'Failed to load tafsir'; })
			.finally(() => { loading = false; });
	});
</script>

<div class="fixed inset-y-0 right-0 w-full max-w-md bg-base-100 border-l border-base-200 shadow-2xl z-40 flex flex-col">
	<div class="flex items-center justify-between px-4 py-3 border-b border-base-200">
		<div>
			<h2 class="font-semibold text-base-content text-sm">Tafsir</h2>
			<p class="text-xs text-base-content/50">{verseKey}</p>
		</div>
		<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close tafsir">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6 6 18M6 6l12 12"/>
			</svg>
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		{#if loading}
			<div class="flex justify-center pt-8">
				<span class="loading loading-spinner loading-md text-primary"></span>
			</div>
		{:else if error}
			<p class="text-error text-sm">{error}</p>
		{:else if content}
			<p class="text-xs text-base-content/40 mb-3">{content.resourceName}</p>
			<div class="prose prose-sm max-w-none text-base-content/80 leading-relaxed">
				{@html content.text}
			</div>
		{/if}
	</div>
</div>
