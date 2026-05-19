<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import AudioPlayer from '$lib/components/audio/AudioPlayer.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';
	import ReciterSelectionBody from '$lib/components/panels/settings/ReciterSelectionBody.svelte';
	import { navbarState } from '$lib/state/navbar.svelte';
	import MainNavDrawer from '$lib/components/MainNavDrawer.svelte';
	import AnnouncementBanner from '$lib/components/AnnouncementBanner.svelte';
	import type { Reciter } from '$lib/types/quran';

	let searchOpen = $state(false);
	let navDrawerOpen = $state(false);

	import type { LayoutData } from './$types';
	let { children, data }: { children: any; data: LayoutData } = $props();

	const user = $derived(data.user);
	const reciters = $derived((data.reciters ?? []) as Reciter[]);

	let lastScrollY = 0;
	const THRESHOLD = 6;
	let locked = false;

	function onScroll() {
		if (locked) { lastScrollY = window.scrollY; return; }
		const current = window.scrollY;
		if (current < 10) {
			navbarState.visible = true;
		} else if (lastScrollY - current > THRESHOLD) {
			navbarState.visible = true;
			locked = true;
			setTimeout(() => { locked = false; lastScrollY = window.scrollY; }, 350);
		} else if (current - lastScrollY > THRESHOLD) {
			navbarState.visible = false;
			locked = true;
			setTimeout(() => { locked = false; lastScrollY = window.scrollY; }, 350);
		}
		lastScrollY = current;
	}
</script>

<svelte:window onscroll={onScroll} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col">
	<AnnouncementBanner />
	<nav class="flex items-center h-12 bg-base-200 border-b border-base-300 px-4 sticky z-30 transition-transform duration-300 {navbarState.visible ? 'translate-y-0' : '-translate-y-full'}" style="top: {navbarState.navbarTop * 4}px">
		<!-- Left: logo -->
		<div class="flex-1">
			<a href="/" class="text-base-content hover:opacity-75 transition-opacity" style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.1rem; letter-spacing: -0.01em;">
				Quran.bid
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

			<!-- Hamburger: opens main nav drawer -->
			<button class="btn btn-ghost btn-sm btn-circle" aria-label="Open Navigation Drawer" onclick={() => (navDrawerOpen = true)}>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M0 19.5h23.25v-2.584H0zm0-6.459h23.25V10.46H0zM0 4v2.584h23.25V4z"/></svg>
			</button>

			<!-- Profile / Login -->
			{#if user}
				<div class="dropdown dropdown-end">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<button tabindex="0" class="btn btn-ghost btn-sm btn-circle" aria-label="Profile">
						{#if user.image}
							<div class="avatar">
								<div class="w-7 rounded-full">
									<img src={user.image} alt={user.name ?? 'Profile'} />
								</div>
							</div>
						{:else}
							<div class="avatar avatar-placeholder">
								<div class="w-7 rounded-full bg-primary/20 text-primary">
									<span class="text-xs font-semibold">{(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}</span>
								</div>
							</div>
						{/if}
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul tabindex="0" class="dropdown-content bg-base-100 rounded-xl z-50 w-52 py-1.5 shadow-lg border border-base-200 mt-2">
						<li>
							<a href="/profile" class="flex items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 20 20"><path fill="currentColor" fill-rule="evenodd" stroke="currentColor" d="M10 1.166a4.833 4.833 0 0 0-1.342 9.478c-1.593.194-2.958.757-3.987 1.77C3.362 13.706 2.7 15.627 2.7 18.134a.633.633 0 1 0 1.267 0c0-2.294.604-3.84 1.594-4.816.993-.978 2.475-1.484 4.44-1.484 1.963 0 3.445.506 4.438 1.484.99.976 1.594 2.522 1.594 4.816a.633.633 0 1 0 1.267 0c0-2.507-.663-4.428-1.972-5.718-1.029-1.014-2.394-1.577-3.986-1.771a4.835 4.835 0 0 0-1.342-9.478ZM6.432 5.999a3.567 3.567 0 1 1 7.133 0 3.567 3.567 0 0 1-7.133 0Z" clip-rule="evenodd"/></svg>
								Profile
							</a>
						</li>
						<li>
							<a href="/my-quran" class="flex items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.5 1.75h-9v12L8 9.25l4.5 4.5zm.412-1.5q.216 0 .413.092.309.134.492.42.183.287.183.635v13.206q0 .348-.183.635a1.08 1.08 0 0 1-.492.42 1 1 0 0 1-.412.082q-.45 0-.779-.328L8 11.068l-4.134 4.344a1.07 1.07 0 0 1-.779.338 1 1 0 0 1-.412-.092 1.08 1.08 0 0 1-.492-.42A1.16 1.16 0 0 1 2 14.603V1.397q0-.348.183-.635t.492-.42A1 1 0 0 1 3.088.25z"/><path d="M12.5 1.75h-9v12L8 9.25l4.5 4.5z"/></svg>
								My Quran
							</a>
						</li>
						<li>
							<a href="/reading-goal" class="flex items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>
								Reading Goal
							</a>
						</li>
						<li>
							<a href="/reading-history" class="flex items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg>
								Reading history
							</a>
						</li>
						<li>
							<a href="/learning-plans" class="flex items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 15 15"><path fill="currentColor" fill-rule="evenodd" d="M4.2 1h-.023c-.308 0-.573 0-.79.02-.231.023-.459.071-.67.201a1.5 1.5 0 0 0-.496.495c-.13.212-.178.44-.2.67C2 2.604 2 2.87 2 3.177v8.646c0 .308 0 .573.02.79.023.231.071.459.201.67a1.5 1.5 0 0 0 .495.496c.212.13.44.178.67.2.218.021.483.021.791.021h6.646c.308 0 .573 0 .79-.02.231-.023.459-.071.67-.201a1.5 1.5 0 0 0 .496-.495c.13-.212.178-.44.2-.67.021-.218.021-.483.021-.791V3.177c0-.308 0-.573-.02-.79a1.5 1.5 0 0 0-.201-.67 1.5 1.5 0 0 0-.495-.496 1.5 1.5 0 0 0-.67-.2A9 9 0 0 0 10.823 1H4.2m-.961 1.074c.028-.018.085-.043.242-.058C3.645 2.001 3.863 2 4.2 2h6.6c.337 0 .555 0 .72.016.156.015.213.04.241.058a.5.5 0 0 1 .165.165c.018.028.043.085.058.242.015.164.016.382.016.719v8.6c0 .337 0 .555-.016.72-.015.156-.04.213-.058.241a.5.5 0 0 1-.165.165c-.028.018-.085.043-.242.058A9 9 0 0 1 10.8 13H4.2c-.337 0-.555 0-.72-.016-.156-.015-.213-.04-.241-.058a.5.5 0 0 1-.165-.165c-.018-.028-.043-.085-.058-.242A9 9 0 0 1 3 11.8V3.2c0-.337 0-.555.016-.72.015-.156.04-.213.058-.241a.5.5 0 0 1 .165-.165M5 10a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm-.5-2.5A.5.5 0 0 1 5 7h5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 4a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z" clip-rule="evenodd"/></svg>
								My Learning Plans
							</a>
						</li>
						<li class="border-t border-base-200 mt-1 pt-1">
							<form method="post" action="/api/sign-out">
								<button type="submit" class="flex w-full items-center gap-3 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 transition-colors rounded-lg mx-1">
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
									Logout
								</button>
							</form>
						</li>
					</ul>
				</div>
			{:else}
				<a href="/login" class="btn btn-primary btn-sm rounded-full">Login</a>
			{/if}
		</div>
	</nav>

	<div class="flex-1 pb-14">
		{@render children()}
	</div>

	<Footer />

	<AudioPlayer />
</div>

<!-- Global reciter drawer -->
{#if navbarState.reciterDrawerOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[70]" onclick={() => (navbarState.reciterDrawerOpen = false)} onkeydown={(e) => e.key === 'Escape' && (navbarState.reciterDrawerOpen = false)}></div>
	<div class="fixed right-0 top-0 z-[71] h-screen w-80 border-l border-base-200 bg-base-100 shadow-2xl flex flex-col">
		<div class="flex items-center justify-between border-b border-base-200 px-4 py-3">
			<h2 class="font-semibold text-base-content">Reciter</h2>
			<button class="btn btn-ghost btn-sm btn-circle" onclick={() => (navbarState.reciterDrawerOpen = false)} aria-label="Close">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
			</button>
		</div>
		<div class="flex-1 overflow-y-auto">
			<ReciterSelectionBody {reciters} onClose={() => (navbarState.reciterDrawerOpen = false)} />
		</div>
	</div>
{/if}

<MainNavDrawer open={navDrawerOpen} onClose={() => (navDrawerOpen = false)} />

<SearchModal open={searchOpen} onClose={() => (searchOpen = false)} />
