<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { fetchAdvancedSearch } from '$lib/api/quran';
	import type { GatewaySearchResult, GatewaySearchResponse } from '$lib/types/quran';

	const MARK_OPEN = `<mark style="background:none;font-weight:700;color:var(--color-primary);font-style:normal;">`;

	function highlightEm(s: string): string {
		return s
			.replace(/<em>/g, MARK_OPEN)
			.replace(/<\/em>/g, '</mark>')
			.replace(/<(?!mark|\/mark)[^>]+>/g, '');
	}

	const query = $derived($page.url.searchParams.get('query') ?? '');
	const currentPage = $derived(Number($page.url.searchParams.get('page') ?? 1));
	let inputValue = $state(untrack(() => $page.url.searchParams.get('query') ?? ''));

	let data = $state<GatewaySearchResponse | null>(null);
	let loading = $state(false);
	let error = $state(false);

	const PAGE_SIZE = 10;

	async function doSearch(q: string, pg: number) {
		if (!q.trim()) return;
		loading = true;
		error = false;
		data = null;
		try {
			data = await fetchAdvancedSearch(fetch, q, pg, PAGE_SIZE);
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		inputValue = query;
	});

	$effect(() => {
		const q = query;
		const pg = currentPage;
		if (q) untrack(() => doSearch(q, pg));
	});

	function onSubmit(e: Event) {
		e.preventDefault();
		const q = inputValue.trim();
		if (!q) return;
		goto(`/search?query=${encodeURIComponent(q)}&page=1`);
	}

	function goToPage(pg: number) {
		goto(`/search?query=${encodeURIComponent(query)}&page=${pg}`);
	}

	const verses = $derived((data?.result.verses ?? []) as GatewaySearchResult[]);
	const navigation = $derived((data?.result.navigation ?? []).filter((r) => r.resultType !== 'ayah'));
	const totalPages = $derived(data?.pagination.totalPages ?? 1);
	const totalRecords = $derived(data?.pagination.totalRecords ?? 0);
</script>

<svelte:head>
	<title>{query ? `Search: ${query}` : 'Search'} — Quran</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8">
	<form onsubmit={onSubmit} class="mb-6">
		<label class="input-bordered input flex w-full items-center gap-2 rounded-full bg-base-100">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="opacity-50"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="search"
				placeholder="Search the Quran"
				class="grow bg-transparent outline-none"
				bind:value={inputValue}
			/>
			{#if loading}
				<span class="loading loading-xs loading-spinner"></span>
			{/if}
		</label>
	</form>

	{#if loading && !data}
		<div class="flex justify-center py-16">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if error}
		<div class="py-16 text-center text-sm text-base-content/50">Search failed. Try again.</div>
	{:else if data}
		{#if totalRecords === 0 && !navigation.length}
			<div class="py-16 text-center text-sm text-base-content/50">No results for "{query}"</div>
		{:else}
			{#if navigation.length > 0}
				<div class="mb-6">
					<div class="mb-2 text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase">
						Navigation
					</div>
					<div class="flex flex-col gap-1">
						{#each navigation as r (r.key)}
							{@const href =
								r.resultType === 'surah'
									? `/${r.key}`
									: r.resultType === 'juz'
										? `/juz/${String(r.key).replace('j', '')}`
										: `/${r.key}`}
							<a
								{href}
								class="flex items-center gap-3 rounded-lg border border-base-200 bg-base-100 px-4 py-2.5 no-underline hover:bg-base-200"
							>
								<span
									class="rounded bg-primary/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-primary"
									>{r.resultType}</span
								>
								<span class="text-sm font-medium text-base-content"
									>{@html highlightEm(r.name)}</span
								>
								{#if r.arabic}
									<span
										class="ml-auto text-sm text-base-content/70"
										dir="rtl"
										lang="ar"
										style="font-family:'UthmanicHafs',serif;">{r.arabic}</span
									>
								{/if}
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if verses.length > 0}
				<div class="mb-2 flex items-center justify-between">
					<div class="text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase">
						Verses
					</div>
					<span class="text-xs text-base-content/40">{totalRecords} results</span>
				</div>
				<div class="flex flex-col gap-2">
					{#each verses as r (r.key)}
						{@const verseKey = String(r.key)}
						{@const [chId, vNum] = verseKey.split(':')}
						<a
							href="/{chId}?startingVerse={vNum}"
							class="rounded-lg border border-base-200 bg-base-100 px-4 py-3 no-underline hover:bg-base-200"
						>
							<div class="mb-1.5 flex items-center gap-2">
								<span class="font-mono text-xs text-primary">{verseKey}</span>
							</div>
							{#if r.isArabic}
								<p
									class="text-right text-base leading-loose"
									dir="rtl"
									lang="ar"
									style="font-family:'UthmanicHafs',serif;"
								>
									{@html highlightEm(r.name)}
								</p>
							{:else}
								{#if r.arabic}
									<p
										class="mb-1.5 text-right text-base leading-loose"
										dir="rtl"
										lang="ar"
										style="font-family:'UthmanicHafs',serif;"
									>
										{r.arabic}
									</p>
								{/if}
								{#if r.name}
									<p class="text-sm leading-snug text-base-content/70">
										{@html highlightEm(r.name)}
									</p>
								{/if}
							{/if}
						</a>
					{/each}
				</div>

				{#if totalPages > 1}
					<div class="mt-8 flex items-center justify-center gap-2">
						<button
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage <= 1}
							class="btn btn-ghost btn-sm"
						>
							Previous
						</button>
						<span class="text-sm text-base-content/60">Page {currentPage} of {totalPages}</span>
						<button
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage >= totalPages}
							class="btn btn-ghost btn-sm"
						>
							Next
						</button>
					</div>
				{/if}
			{/if}
		{/if}
	{:else if !query}
		<div class="py-16 text-center text-sm text-base-content/50">Enter a query to search.</div>
	{/if}
</main>
