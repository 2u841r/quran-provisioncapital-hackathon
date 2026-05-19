<script lang="ts">
	import { fetchSearch } from '$lib/api/quran';
	import type { GatewaySearchResult } from '$lib/types/quran';
	import type { Chapter } from '$lib/types/quran';
	import VoiceSearch from '$lib/components/VoiceSearch.svelte';

	interface Props {
		surahs: (Chapter & { id: number })[];
	}

	const { surahs }: Props = $props();

	const MARK_OPEN = `<mark style="background:none;font-weight:700;color:var(--color-primary);font-style:normal;">`;

	function highlightEm(s: string): string {
		return s
			.replace(/<em>/g, MARK_OPEN)
			.replace(/<\/em>/g, '</mark>')
			.replace(/<(?!mark|\/mark)[^>]+>/g, '');
	}

	function highlight(text: string, q: string): string {
		if (!q.trim()) return text;
		const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return text.replace(new RegExp(`(${escaped})`, 'gi'), `${MARK_OPEN}$1</mark>`);
	}

	let query = $state('');
	let results = $state<GatewaySearchResult[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let inputEl = $state<HTMLInputElement | null>(null);

	const chapterMatches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return surahs
			.filter(
				(s) =>
					s.nameSimple?.toLowerCase().includes(q) ||
					s.nameComplex?.toLowerCase().includes(q) ||
					s.nameArabic?.includes(q) ||
					s.translatedName?.name?.toLowerCase().includes(q) ||
					String(s.id) === q
			)
			.slice(0, 5);
	});

	function setQuery(q: string) {
		query = q;
		if (inputEl) inputEl.value = q;
		open = true;
		onInput({ target: { value: q } } as unknown as Event);
	}

	function onInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
		open = true;
		if (debounceTimer) clearTimeout(debounceTimer);
		const q = query.trim();
		if (!q) {
			results = [];
			loading = false;
			return;
		}
		loading = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetchSearch(fetch, q) as import('$lib/types/quran').GatewaySearchResponse;
				results = res.result?.navigation ?? [];
			} catch {
				results = [];
			} finally {
				loading = false;
			}
		}, 300);
	}
</script>

<div class="relative w-full max-w-xl">
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
			bind:this={inputEl}
			type="search"
			placeholder="Search the Quran"
			class="grow bg-transparent outline-none"
			value={query}
			oninput={onInput}
			onfocus={() => (open = true)}
		/>
		{#if loading}
			<span class="loading loading-xs loading-spinner"></span>
		{/if}
		<VoiceSearch onTranscript={setQuery} />
	</label>

	{#if open && (loading || results.length > 0 || chapterMatches.length > 0 || query.trim())}
		<div
			class="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-base-300 bg-base-100 shadow-xl"
		>
			{#if chapterMatches.length > 0}
				<div
					class="px-4 pt-3 pb-1 text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase"
				>
					Surahs
				</div>
				{#each chapterMatches as ch (ch.id)}
					<a
						href="/{ch.id}"
						class="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-base-200"
					>
						<span
							class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-base-200 font-mono text-xs text-base-content/60"
							>{ch.id}</span
						>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-semibold text-base-content">
								{@html highlight(ch.nameSimple, query)}
							</div>
							<div class="truncate text-xs text-base-content/60">
								{@html highlight(ch.translatedName.name, query)} · {ch.versesCount} verses
							</div>
						</div>
						<span
							class="text-base text-base-content/70"
							dir="rtl"
							lang="ar"
							style="font-family: 'UthmanicHafs', serif;">{ch.nameArabic}</span
						>
					</a>
				{/each}
			{/if}

			{#if results.length > 0}
				<div
					class="flex items-center justify-between px-4 pt-3 pb-1 {chapterMatches.length > 0
						? 'border-t border-base-200'
						: ''}"
				>
					<span
						class="text-[0.65rem] font-semibold tracking-wide text-base-content/40 uppercase"
						>Verses</span
					>
					<a
						href="/search?query={encodeURIComponent(query)}&page=1"
						class="flex items-center gap-1 text-[0.65rem] font-semibold text-primary no-underline hover:underline"
						onclick={() => (open = false)}
					>
						More results
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
						>
					</a>
				</div>
				{#each results.filter((r) => r.resultType === 'ayah') as r (r.key)}
					{@const verseKey = String(r.key)}
					{@const [chId, vNum] = verseKey.split(':')}
					<a
						href="/{chId}?startingVerse={vNum}"
						class="block border-b border-base-200 px-4 py-3 no-underline last:border-b-0 hover:bg-base-200"
					>
						<div class="mb-1 flex items-center justify-between">
							<span class="font-mono text-xs text-primary">{verseKey}</span>
						</div>
						{#if r.isArabic}
							<p
								class="text-right text-sm leading-relaxed"
								dir="rtl"
								lang="ar"
								style="font-family: 'UthmanicHafs', serif;"
							>
								{@html highlightEm(r.name)}
							</p>
						{:else}
							{#if r.arabic}
								<p
									class="mb-1 text-right text-sm leading-relaxed"
									dir="rtl"
									lang="ar"
									style="font-family: 'UthmanicHafs', serif;"
								>
									{r.arabic}
								</p>
							{/if}
							{#if r.name}
								<p class="text-xs leading-snug text-base-content/70">
									{@html highlightEm(r.name)}
								</p>
							{/if}
						{/if}
					</a>
				{/each}
			{:else if loading}
				<div class="p-4 text-sm text-base-content/50">Searching verses...</div>
			{:else if !chapterMatches.length}
				<div class="p-4 text-sm text-base-content/50">No results</div>
			{/if}
		</div>
	{/if}
</div>
