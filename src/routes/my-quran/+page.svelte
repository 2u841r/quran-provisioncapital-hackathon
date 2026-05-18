<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let { data } = $props<{ data: any }>();

	type Tab = 'saved' | 'recent' | 'notes';
	let activeTab = $state<Tab>('saved');

	let chapters = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			const res = await fetch('/api/proxy/content/chapters?language=en');
			const json = await res.json();
			const map: Record<string, string> = {};
			for (const ch of json.chapters ?? []) {
				map[String(ch.id)] = ch.name_simple;
			}
			chapters = map;
		} catch {}
	});

	function verseLabel(verseKey: string) {
		const [surah, ayah] = verseKey.split(':');
		const name = chapters[surah] ?? `Surah ${surah}`;
		return `${name} ${surah}:${ayah}`;
	}

	function verseUrl(verseKey: string) {
		const [surah] = verseKey.split(':');
		return `/${surah}#${verseKey}`;
	}

	function formatDate(d: string | Date) {
		return new Date(d).toLocaleDateString('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const bookmarksByCollection = $derived.by(() => {
		const map = new SvelteMap<string, typeof data.bookmarks>();
		for (const b of data.bookmarks) {
			const col = b.collectionName ?? 'Favorites';
			if (!map.has(col)) map.set(col, []);
			map.get(col)!.push(b);
		}
		return map;
	});
</script>

<svelte:head>
	<title>My Quran</title>
</svelte:head>

<!-- Header -->
<div class="sticky top-[3.5rem] z-20 bg-base-100 border-b border-base-200">
	<div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
		<a href="/" aria-label="Back" class="btn btn-ghost btn-sm btn-circle">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
			</svg>
		</a>
		<h1 class="text-base font-semibold text-base-content">My Quran</h1>
	</div>
</div>

<div class="max-w-2xl mx-auto px-4 py-4">

	<!-- Tab switcher -->
	<div class="flex rounded-lg bg-base-200 p-0.5 mb-5">
		{#each [['saved', 'Saved'], ['recent', 'Recent'], ['notes', 'Notes']] as [tab, label] (tab)}
			<button
				type="button"
				class="flex-1 py-2 text-sm font-medium rounded-md transition-all {activeTab === tab ? 'bg-base-100 shadow text-base-content' : 'text-base-content/50 hover:text-base-content'}"
				onclick={() => (activeTab = tab as Tab)}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Saved tab -->
	{#if activeTab === 'saved'}
		{#if data.bookmarks.length === 0}
			<div class="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
				<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/>
				</svg>
				<p class="text-sm">No saved verses yet</p>
				<a href="/" class="btn btn-sm btn-ghost">Start reading</a>
			</div>
		{:else}
			{#each [...bookmarksByCollection] as [collection, items] (collection)}
				<section class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/50">{collection}</h2>
						<span class="text-xs text-base-content/40">{items.length} verse{items.length !== 1 ? 's' : ''}</span>
					</div>
					<div class="flex flex-col divide-y divide-base-200 rounded-xl border border-base-200 overflow-hidden">
						{#each items as item (item.id)}
							<a
								href={verseUrl(item.verseKey)}
								class="flex items-center justify-between px-4 py-3 hover:bg-base-200/50 transition-colors"
							>
								<div class="flex flex-col gap-0.5">
									<span class="text-sm font-medium text-base-content">{verseLabel(item.verseKey)}</span>
									<span class="text-xs text-base-content/40">{formatDate(item.createdAt)}</span>
								</div>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="text-base-content/30 shrink-0">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
								</svg>
							</a>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	{/if}

	<!-- Recent tab -->
	{#if activeTab === 'recent'}
		{#if data.history.length === 0}
			<div class="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
				<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/>
				</svg>
				<p class="text-sm">No reading history yet</p>
				<a href="/" class="btn btn-sm btn-ghost">Start reading</a>
			</div>
		{:else}
			<div class="flex flex-col divide-y divide-base-200 rounded-xl border border-base-200 overflow-hidden">
				{#each data.history as item (item.surah)}
					{@const surahName = chapters[String(item.surah)] ?? `Surah ${item.surah}`}
					{#each item.ranges as [from, to], i (i)}
						<a
							href={`/${item.surah}#${item.surah}:${from}`}
							class="flex items-center justify-between px-4 py-3 hover:bg-base-200/50 transition-colors"
						>
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium text-base-content">
									{surahName} · {from === to ? `${item.surah}:${from}` : `${item.surah}:${from}–${to}`}
								</span>
								{#if i === 0}
									<span class="text-xs text-base-content/40">{formatDate(item.readAt)}</span>
								{/if}
							</div>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="text-base-content/30 shrink-0">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
							</svg>
						</a>
					{/each}
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Notes tab (placeholder) -->
	{#if activeTab === 'notes'}
		<div class="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
			<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
			</svg>
			<p class="text-sm">Notes coming soon</p>
		</div>
	{/if}

</div>
