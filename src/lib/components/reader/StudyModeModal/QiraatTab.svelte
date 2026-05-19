<script lang="ts">
	import type { QiraatResponse } from '$lib/types/quran';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';

	interface Props {
		data: QiraatResponse | null;
		loading: boolean;
		error: string | null;
		onRetry: () => void;
	}

	const { data, loading, error, onRetry }: Props = $props();

	let selectedJunctureId = $state<number | null>(null);

	$effect(() => {
		if (data?.junctures?.length && selectedJunctureId === null) {
			selectedJunctureId = data.junctures[0].id;
		}
	});

	const selectedJuncture = $derived(
		data?.junctures?.find((j) => j.id === selectedJunctureId) ?? null
	);
</script>

{#if loading}
	<LoadingState />
{:else if error}
	<div class="flex flex-col items-center gap-3 py-16">
		<p class="text-sm text-error">{error}</p>
		<button class="btn btn-ghost btn-sm" onclick={onRetry}>Retry</button>
	</div>
{:else if !data?.junctures?.length}
	<EmptyState icon="book" title="No Qiraat" description="No variant readings for this verse" />
{:else}
	<div class="flex flex-col">
		{#if data.junctures.length > 1}
			<div class="flex gap-1.5 overflow-x-auto border-b border-base-200 px-4 py-2.5 scrollbar-none">
				{#each data.junctures as juncture (juncture.id)}
					<button
						class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedJunctureId === juncture.id ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/70 hover:bg-base-300'}"
						onclick={() => (selectedJunctureId = juncture.id)}
					>
						{juncture.text}
					</button>
				{/each}
			</div>
		{/if}

		{#if selectedJuncture}
			<div class="divide-y divide-base-200">
				{#each selectedJuncture.readings as reading (reading.id)}
					<div class="px-4 py-4">
						<div class="mb-2 flex items-start justify-between gap-3">
							<p
								class="text-lg font-medium leading-snug"
								dir="rtl"
								lang="ar"
								style="font-family: 'UthmanicHafs', serif;"
							>
								{reading.textUthmani}
							</p>
							<span
								class="mt-1 shrink-0 rounded-full border border-base-300 px-2 py-0.5 text-[0.6rem] font-medium text-base-content/50"
								style="background: {reading.color}22"
							>
								{reading.color}
							</span>
						</div>
						{#if reading.translation}
							<p class="mb-1 text-sm text-base-content/80">{reading.translation}</p>
						{/if}
						{#if reading.explanation?.text}
							<p class="text-xs leading-relaxed text-base-content/50">{@html reading.explanation.text}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	div {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	div::-webkit-scrollbar {
		display: none;
	}
</style>
