<script lang="ts">
	type Icon = 'book' | 'lock' | 'plus';

	interface Props {
		icon: Icon;
		title: string;
		description?: string;
	}

	const { icon, title, description }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-20 text-base-content/30">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="1.5"
	>
		{#if icon === 'book'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
			/>
		{:else if icon === 'lock'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
			/>
		{:else}
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
		{/if}
	</svg>
	<p class="text-sm {icon === 'book' ? 'font-medium' : ''}">{title}</p>
	{#if description}
		<p class="text-xs text-base-content/20">{description}</p>
	{/if}
</div>
