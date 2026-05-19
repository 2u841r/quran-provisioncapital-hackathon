<script lang="ts">
	import type { LayersResponse } from '$lib/types/quran';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';

	interface Props {
		data: LayersResponse | null;
		loading: boolean;
		error: string | null;
		onRetry: () => void;
	}

	const { data, loading, error, onRetry }: Props = $props();

	let selectedByGroup = $state<Record<string, string>>({});
	let activeGroupKey = $state<string | null>(null);

	$effect(() => {
		if (!data?.groups) return;
		const defaults: Record<string, string> = {};
		for (const group of data.groups) {
			if (!selectedByGroup[group.groupKey]) {
				defaults[group.groupKey] = group.defaultOptionKey || group.options[0]?.optionKey;
			}
		}
		selectedByGroup = { ...selectedByGroup, ...defaults };
	});

	function getSelectedHtml(groupKey: string): string {
		const group = data?.groups.find((g) => g.groupKey === groupKey);
		if (!group) return '';
		const key = selectedByGroup[groupKey] || group.defaultOptionKey;
		return group.options.find((o) => o.optionKey === key)?.collapsedHtml ?? '';
	}

	function selectOption(groupKey: string, optionKey: string) {
		selectedByGroup = { ...selectedByGroup, [groupKey]: optionKey };
		activeGroupKey = null;
	}

	function toggleGroup(groupKey: string) {
		activeGroupKey = activeGroupKey === groupKey ? null : groupKey;
	}
</script>

{#if loading}
	<LoadingState />
{:else if error}
	<div class="flex flex-col items-center gap-3 py-16">
		<p class="text-sm text-error">{error}</p>
		<button class="btn btn-ghost btn-sm" onclick={onRetry}>Retry</button>
	</div>
{:else if !data}
	<EmptyState icon="book" title="No layered translations" description="Not available for this verse" />
{:else}
	<div class="px-4 py-4">
		{#if data.resource.description}
			<p class="mb-4 text-xs text-base-content/50">{data.resource.description}</p>
		{/if}

		<div class="text-sm leading-loose">
			{#each data.collapsedTokens as token, i (i)}
				{#if token.type === 'text'}
					<span>{@html token.html ?? ''}</span>
				{:else if token.type === 'alt_group' && token.groupKey}
					{@const group = data.groups.find((g) => g.groupKey === token.groupKey)}
					{@const isActive = activeGroupKey === token.groupKey}
					{#if group}
						<span class="relative inline-block">
							<button
								class="rounded px-0.5 font-medium underline decoration-dotted underline-offset-2 transition-colors {isActive ? 'bg-primary/20 text-primary' : 'text-primary hover:bg-primary/10'}"
								onclick={() => toggleGroup(token.groupKey!)}
							>
								{@html getSelectedHtml(token.groupKey!)}
							</button>
							{#if isActive}
								<div class="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-base-200 bg-base-100 shadow-xl">
									{#each group.options as opt (opt.optionKey)}
										<button
											class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-base-200 {selectedByGroup[token.groupKey!] === opt.optionKey ? 'font-medium text-primary' : 'text-base-content'}"
											onclick={() => selectOption(token.groupKey!, opt.optionKey)}
										>
											{#if selectedByGroup[token.groupKey!] === opt.optionKey}
												<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
											{:else}
												<span class="w-2.5"></span>
											{/if}
											{@html opt.collapsedHtml}
										</button>
									{/each}
									{#if group.explanationHtml}
										<div class="border-t border-base-200 px-3 py-2 text-xs text-base-content/50">
											{@html group.explanationHtml}
										</div>
									{/if}
								</div>
							{/if}
						</span>
					{/if}
				{/if}
			{/each}
		</div>

		<p class="mt-4 text-xs text-base-content/40">Source: {data.resource.name}</p>
	</div>
{/if}
