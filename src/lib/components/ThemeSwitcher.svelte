<script lang="ts">
	const themes = [
		{ name: 'caramellatte', label: 'Peach' },
		{ name: 'valentine', label: 'Pink' },
		{ name: 'lemonade', label: 'Lemonade' },
		{ name: 'aqua', label: 'Aqua' },
		{ name: 'cyberpunk', label: 'Cyberpunk' },
		{ name: 'light', label: 'Light' },
		{ name: 'dark', label: 'Dark' },
		{ name: 'coffee', label: 'Coffee' },
		{ name: 'luxury', label: 'Luxury' },
		{ name: 'abyss', label: 'Abyss' }
	];

	let current = $state(
		typeof localStorage !== 'undefined'
			? (localStorage.getItem('theme') ?? 'caramellatte')
			: 'caramellatte'
	);

	function setTheme(name: string) {
		current = name;
		document.documentElement.setAttribute('data-theme', name);
		localStorage.setItem('theme', name);
	}
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="4"/>
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
		</svg>
		<span class="hidden sm:inline text-sm">{themes.find(t => t.name === current)?.label ?? 'Theme'}</span>
		<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box border border-base-200 shadow-lg w-36 p-1 z-50">
		{#each themes as theme (theme.name)}
			<li>
				<button
					class="w-full text-sm text-left"
					class:active={current === theme.name}
					onclick={() => setTheme(theme.name)}
				>
					{theme.label}
				</button>
			</li>
		{/each}
	</ul>
</div>
