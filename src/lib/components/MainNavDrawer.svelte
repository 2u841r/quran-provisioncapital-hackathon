<script lang="ts">
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	const { open, onClose }: Props = $props();

	// Close on navigation (only track pathname, not open)
	$effect(() => {
		page.url.pathname;
		untrack(() => { if (open) onClose(); });
	});

	// Lock body scroll when open
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => { document.body.style.overflow = ''; };
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	const NAV_ITEMS = [
		{
			title: 'Read',
			href: '/',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9.6 22.4v-7.2h4.8v7.2h6v-9.6H24L12 2 0 12.8h3.6v9.6z"/></svg>`
		},
		{
			title: 'My Quran',
			href: '/my-quran',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M12.5 1.75h-9v12L8 9.25l4.5 4.5zm.412-1.5q.216 0 .413.092.309.134.492.42.183.287.183.635v13.206q0 .348-.183.635a1.08 1.08 0 0 1-.492.42 1 1 0 0 1-.412.082q-.45 0-.779-.328L8 11.068l-4.134 4.344a1.07 1.07 0 0 1-.779.338 1 1 0 0 1-.412-.092 1.08 1.08 0 0 1-.492-.42A1.16 1.16 0 0 1 2 14.603V1.397q0-.348.183-.635t.492-.42A1 1 0 0 1 3.088.25z"/><path d="M12.5 1.75h-9v12L8 9.25l4.5 4.5z"/></svg>`
		},
		{
			title: 'Quran Radio',
			href: '/radio',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill="currentColor" d="M8 1.333A6.667 6.667 0 0 0 1.333 8v1.333h1.334A1.333 1.333 0 0 1 4 10.667v4A1.333 1.333 0 0 1 2.667 16H1.333A1.334 1.334 0 0 1 0 14.667V8a8 8 0 0 1 16 0v6.667A1.334 1.334 0 0 1 14.667 16h-1.334A1.334 1.334 0 0 1 12 14.667v-4a1.333 1.333 0 0 1 1.333-1.334h1.334V8A6.667 6.667 0 0 0 8 1.333"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>`
		},
		{
			title: 'Learning Plans',
			href: '/learning-plans',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.934 0 6.267 8 10.6l6.546-3.546v4.99H16V6.268M2.91 9.286v2.889L8 14.934l5.09-2.76V9.287L8 12.045z"/></svg>`
		},
		{
			title: 'Reading Goal',
			href: '/reading-goal',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`
		},
		{
			title: 'Reading History',
			href: '/reading-history',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg>`
		},
		{
			title: 'Games',
			href: '/games',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M7.97 16L5 19c-.67.67-1.41.43-1.41.43C2.54 19 2 18.2 2 17.27V15c0-1.1.9-2 2-2h3a2 2 0 0 1 2 2v.17L7.97 16zM22 17.27c0 .93-.54 1.73-1.59 1.73 0 0-.74.24-1.41-.43L16 16l-1-1V15a2 2 0 0 1 2-2h3c1.1 0 2 .9 2 2v2.27zM11 11V7c0-1.1-.9-2-2-2H7C5.9 5 5 5.9 5 7v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2zm6 0V7c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2zm-2-3h-2V6h2v2zm-6 0H7V6h2v2z"/></svg>`
		},
	] as const;
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 {open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"
	onclick={onClose}
></div>

<!-- Drawer panel -->
<div
	class="fixed inset-y-0 right-0 z-[61] flex w-full flex-col bg-base-100 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:w-80 {open ? 'translate-x-0' : 'translate-x-full'}"
	role="dialog"
	aria-modal="true"
	aria-label="Navigation menu"
>
	<!-- Header: matches navbar height (h-12) -->
	<div class="flex h-12 shrink-0 items-center justify-between border-b border-base-200 px-4">
		<a href="/" onclick={onClose} class="font-semibold text-base-content hover:opacity-75 transition-opacity">
			Quran
		</a>
		<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close navigation">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
		</button>
	</div>

	<!-- Nav items -->
	<div class="flex-1 overflow-y-auto overscroll-contain py-2">
		{#each NAV_ITEMS as item (item.href)}
			<a
				href={item.href}
				onclick={onClose}
				class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-base-content/80 hover:bg-base-200 transition-colors {page.url.pathname === item.href ? 'text-primary bg-primary/5' : ''}"
			>
				<span class="shrink-0 text-base-content/60 {page.url.pathname === item.href ? '!text-primary' : ''}">
					{@html item.icon}
				</span>
				{item.title}
			</a>
		{/each}
	</div>

	<!-- Footer: language + theme + donate -->
	<div class="shrink-0 border-t border-base-200 px-4 py-4 flex flex-col gap-3">
		<div class="flex items-center gap-2">
			<button class="btn btn-ghost btn-sm rounded-full gap-1.5 text-xs">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
				English
			</button>
			<ThemeSwitcher dropup />
		</div>
		<a
			href="https://give.quran.foundation/campaign/802362/donate"
			target="_blank"
			rel="noreferrer"
			class="btn btn-primary btn-sm rounded-full w-full gap-1.5"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 14 15"><path d="M0 7.5q.22-.096.61-.287.39-.192 1.447-.875a17 17 0 0 0 1.947-1.463 9 9 0 0 0 1.072-1.121q.508-.63.845-1.183a23 23 0 0 0 .594-1.032 8 8 0 0 0 .368-.752L7.008.5q.03.109.11.294.077.185.36.731.281.547.601 1.06.321.513.845 1.155.525.643 1.087 1.135.876.78 1.877 1.436 1.002.655 1.565.916L14 7.5q-.22.096-.61.294t-1.447.875q-1.056.676-1.932 1.456a9.4 9.4 0 0 0-1.08 1.121q-.514.63-.852 1.183-.336.553-.594 1.032t-.368.752l-.11.287-.124-.294a14 14 0 0 0-.36-.731 15 15 0 0 0-.602-1.06 12 12 0 0 0-.837-1.155 9 9 0 0 0-1.08-1.135 17 17 0 0 0-1.9-1.436q-1.01-.656-1.54-.922Q.031 7.5 0 7.5"/></svg>
			Become a Monthly Donor
		</a>
	</div>
</div>
