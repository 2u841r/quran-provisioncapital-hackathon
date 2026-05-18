<script lang="ts">
	interface Props {
		onPreviousPage: () => void;
		onNextPage: () => void;
		canGoPrevious?: boolean;
		canGoNext?: boolean;
	}

	const { onPreviousPage, onNextPage, canGoPrevious = true, canGoNext = true }: Props = $props();

	function previousPage() {
		if (canGoPrevious) onPreviousPage();
	}

	function nextPage() {
		if (canGoNext) onNextPage();
	}
</script>

<div class="fixed right-6 bottom-8 z-[298] hidden flex-col items-center gap-1.5 md:flex">
	<button
		type="button"
		class="btn btn-square border border-base-200 bg-base-100/95 shadow-sm btn-ghost backdrop-blur transition-opacity btn-sm"
		class:opacity-40={!canGoPrevious}
		disabled={!canGoPrevious}
		onclick={previousPage}
		aria-label="Previous page"
		title="Previous page"
	>
		<svg
			class="rotate-180"
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.25"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	<button
		type="button"
		class="btn btn-square border border-base-200 bg-base-100/95 shadow-sm btn-ghost backdrop-blur transition-opacity btn-sm"
		class:opacity-40={!canGoNext}
		disabled={!canGoNext}
		onclick={nextPage}
		aria-label="Next page"
		title="Next page"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.25"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>
</div>
