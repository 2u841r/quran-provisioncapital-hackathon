<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import AudioPlayer from '$lib/components/audio/AudioPlayer.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';
	import { navbarState } from '$lib/state/navbar.svelte';
	import { uiState } from '$lib/state/ui.svelte';

	// Lock page scroll while any drawer/modal is open
	$effect(() => {
		if (typeof document === 'undefined') return;
		const locked = uiState.scrollLockCount > 0;
		const html = document.documentElement;
		const body = document.body;
		if (locked) {
			html.style.overflow = 'hidden';
			body.style.overflow = 'hidden';
		} else {
			html.style.overflow = '';
			body.style.overflow = '';
		}
	});

	let searchOpen = $state(false);

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
		<!-- Left: logo -->
		<div class="flex-1">
			<a href="/" class="font-semibold text-base-content hover:opacity-75 transition-opacity">
				Quran
			</a>
		</div>

		<!-- Right: items container -->
		<div class="flex-none flex items-center gap-1">
			<!-- Language selector dropdown -->
			<div class="dropdown dropdown-end">
				<button tabindex="0" class="btn btn-ghost btn-sm btn-circle" aria-label="Languages">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="2" y1="12" x2="22" y2="12"/>
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
					</svg>
				</button>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow border border-base-200 mt-2">
					<li>
						<button class="active">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
							English
						</button>
					</li>
				</ul>
			</div>

			<!-- Search shortcut -->
			<button class="btn btn-ghost btn-sm btn-circle" aria-label="Search" onclick={() => (searchOpen = true)}>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/>
					<path d="m21 21-4.3-4.3"/>
				</svg>
			</button>

			<ThemeSwitcher />

			<!-- Profile / Login -->
			{#if false}
				<!-- Logged-in: profile dropdown (stubbed; all links → /#) -->
				<div class="dropdown dropdown-end">
					<button tabindex="0" class="btn btn-ghost btn-sm btn-circle" aria-label="Profile">
						<div class="avatar avatar-placeholder">
							<div class="w-7 rounded-full bg-primary/20 text-primary">
								<span class="text-xs font-semibold">U</span>
							</div>
						</div>
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-200 mt-2">
						<li><a href="/#">My Profile</a></li>
						<li><a href="/#">Bookmarks</a></li>
						<li><a href="/#">Notes & Reflections</a></li>
						<li><a href="/#">Reading History</a></li>
						<li><a href="/#">Settings</a></li>
						<li><a href="/#">Log out</a></li>
					</ul>
				</div>
			{:else}
				<a href="/#" class="btn btn-primary btn-sm rounded-full">Login</a>
			{/if}
		</div>
	</nav>

	<div class="pb-14">
		{@render children()}
	</div>

	<Footer />

	<AudioPlayer />
</div>

<SearchModal open={searchOpen} onClose={() => (searchOpen = false)} />
