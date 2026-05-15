<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content">
	<nav class="navbar bg-base-200 border-b border-base-300 px-4">
		<div class="flex-1">
			<a href="/" class="font-semibold text-base-content hover:opacity-75 transition-opacity">
				Quran
			</a>
		</div>
		<div class="flex-none">
			<ThemeSwitcher />
		</div>
	</nav>

	{@render children()}
</div>
