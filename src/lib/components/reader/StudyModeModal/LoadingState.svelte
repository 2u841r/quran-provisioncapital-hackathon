<script lang="ts">
	interface Props {
		className?: string;
	}

	const { className = 'py-16' }: Props = $props();
</script>

<div class="flex items-center justify-center {className}">
	<span class="loading loading-md loading-spinner text-primary"></span>
</div>
