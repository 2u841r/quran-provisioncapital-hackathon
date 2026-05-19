<script lang="ts">
	import { navbarState } from '$lib/state/navbar.svelte';
</script>

{#if navbarState.bannerVisible}
<div class="sticky top-0 z-40 flex items-center justify-center gap-3 bg-secondary px-4 py-2 text-xs font-medium text-secondary-content sm:text-sm">
	<span class="text-center leading-snug">Participating in the Quran Foundation Hackathon.</span>
	<a
		href="https://launch.provisioncapital.com/quran-hackathon"
		target="_blank"
		rel="noreferrer"
		aria-label="Learn more"
		class="shrink-0 rounded-full bg-secondary-content/20 p-1 text-secondary-content hover:bg-secondary-content/30 transition-colors"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
	</a>
</div>
{/if}
