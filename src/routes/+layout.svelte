<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import AudioPlayer from '$lib/components/audio/AudioPlayer.svelte';
	import { navbarState } from '$lib/state/navbar.svelte';

	let { children } = $props();

	let lastScrollY = 0;

	function onScroll() {
		const current = window.scrollY;
		if (current < 10) {
			navbarState.visible = true;
		} else if (current < lastScrollY - 2) {
			navbarState.visible = true;
		} else if (current > lastScrollY + 4) {
			navbarState.visible = false;
		}
		lastScrollY = current;
	}
</script>

<svelte:window onscroll={onScroll} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content">
	<nav class="navbar bg-base-200 border-b border-base-300 px-4 sticky top-0 z-30 transition-transform duration-300 {navbarState.visible ? 'translate-y-0' : '-translate-y-full'}">
		<div class="flex-1">
			<a href="/" class="font-semibold text-base-content hover:opacity-75 transition-opacity">
				Quran
			</a>
		</div>
		<div class="flex-none">
			<ThemeSwitcher />
		</div>
	</nav>

	<div class="pb-14">
		{@render children()}
	</div>

	<AudioPlayer />
</div>
