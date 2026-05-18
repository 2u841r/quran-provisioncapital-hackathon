<script lang="ts">
	interface Props {
		pageNumber: number;
	}

	const { pageNumber }: Props = $props();
</script>

<div class="mushaf-page-footer flex justify-center pt-3 pb-1">
	<a
		href="/page/{pageNumber}"
		class="text-xs text-base-content/40 hover:text-base-content/70 transition-colors tabular-nums"
		aria-label="Page {pageNumber}"
	>
		{pageNumber}
	</a>
</div>
