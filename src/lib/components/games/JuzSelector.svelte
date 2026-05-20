<script lang="ts">
	interface Props {
		onSelect: (start: number, end: number) => void;
	}
	let { onSelect }: Props = $props();

	let firstTap = $state<number | null>(null);
	let secondTap = $state<number | null>(null);

	const rangeStart = $derived(
		firstTap !== null && secondTap !== null ? Math.min(firstTap, secondTap) : firstTap
	);
	const rangeEnd = $derived(
		firstTap !== null && secondTap !== null ? Math.max(firstTap, secondTap) : firstTap
	);

	function tap(juz: number) {
		if (firstTap === null) {
			firstTap = juz;
		} else if (secondTap === null) {
			if (juz === firstTap) {
				firstTap = null;
			} else {
				secondTap = juz;
				const s = Math.min(firstTap, juz);
				const e = Math.max(firstTap, juz);
				onSelect(s, e);
			}
		} else {
			firstTap = juz;
			secondTap = null;
		}
	}

	function isInRange(juz: number) {
		if (rangeStart === null) return false;
		if (rangeEnd === null) return juz === rangeStart;
		return juz >= rangeStart && juz <= rangeEnd;
	}

	function reset() {
		firstTap = null;
		secondTap = null;
	}
</script>

<div class="w-full">
	<div class="flex items-center justify-between mb-3">
		<p class="text-sm text-base-content/70">
			{#if rangeStart === null}
				Tap a juz to start
			{:else if rangeEnd === null || rangeStart === rangeEnd}
				Juz {rangeStart} selected — tap another to extend range
			{:else}
				Juz {rangeStart} – {rangeEnd}
			{/if}
		</p>
		{#if firstTap !== null}
			<button
				type="button"
				class="text-xs text-base-content/50 hover:text-base-content transition-colors"
				onclick={reset}
			>
				Reset
			</button>
		{/if}
	</div>

	<div class="grid grid-cols-6 gap-1.5">
		{#each Array.from({ length: 30 }, (_, i) => i + 1) as juz (juz)}
			<button
				type="button"
				class="h-10 rounded-lg text-sm font-semibold transition-all border
					{isInRange(juz)
						? 'bg-success text-white border-success shadow-sm'
						: 'bg-base-200 text-base-content/70 border-base-300 hover:border-success/50 hover:bg-base-300'}"
				onclick={() => tap(juz)}
			>
				{juz}
			</button>
		{/each}
	</div>
</div>
