<script lang="ts">
	import type { RelatedVerse } from '$lib/types/quran';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';

	interface Props {
		items: RelatedVerse[];
		loading: boolean;
		error: string | null;
		onRetry: () => void;
		onNavigate: () => void;
	}

	const { items, loading, error, onRetry, onNavigate }: Props = $props();
</script>

{#if loading}
	<LoadingState />
{:else if error}
	<div class="flex flex-col items-center gap-3 py-16">
		<p class="text-sm text-error">{error}</p>
		<button class="btn btn-ghost btn-sm" onclick={onRetry}>Retry</button>
	</div>
{:else if items.length === 0}
	<EmptyState icon="book" title="No related verses" description="No related verses found for this verse" />
{:else}
	<div class="divide-y divide-base-200">
		{#each items as verse (verse.id)}
			{@const [chId, vNum] = verse.verseKey.split(':')}
			<a
				href="/{chId}?startingVerse={vNum}"
				onclick={onNavigate}
				class="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-base-200"
			>
				<div class="min-w-0">
					<span class="font-mono text-xs text-primary">{verse.verseKey}</span>
					<p class="truncate text-sm text-base-content">{verse.chapterName}</p>
					{#if verse.relation}
						<p class="text-xs capitalize text-base-content/50">{verse.relation.replace(/_/g, ' ')}</p>
					{/if}
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-base-content/30"><path d="m9 18 6-6-6-6"/></svg>
			</a>
		{/each}
	</div>
{/if}
