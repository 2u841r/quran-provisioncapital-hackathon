<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { fetchMushafPage } from '$lib/api/quran';
	import { readerState } from '$lib/state/reader.svelte';
	import type { Word } from '$lib/types/quran';

	interface Props {
		initialPage: number;
	}

	const { initialPage }: Props = $props();

	let pageOffset = $state(0);
	const pageNum = $derived(initialPage + pageOffset);

	let loading = $state(false);
	let error = $state<string | null>(null);

	type LineWord = {
		text: string;
		lineNumber: number;
		verseKey: string;
		charTypeName: string;
		position: number;
	};

	const lineMap = new SvelteMap<number, LineWord[]>();

	// Inject QCF per-page font-faces (v2 and v4/Tajweed)
	$effect(() => {
		if (typeof document === 'undefined') return;
		const p = pageNum;
		const idV2 = `qcf-p${p}-v2`;
		if (!document.getElementById(idV2)) {
			const s = document.createElement('style');
			s.id = idV2;
			s.textContent = `@font-face{font-family:p${p}-v2;src:url('/fonts-v2/p${p}.woff2') format('woff2');}`;
			document.head.appendChild(s);
		}
		const idV4 = `qcf-p${p}-v4`;
		if (!document.getElementById(idV4)) {
			const s = document.createElement('style');
			s.id = idV4;
			s.textContent = `@font-face{font-family:p${p}-v4;src:url('/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2') format('woff2');}`;
			document.head.appendChild(s);
		}
	});

	$effect(() => {
		const p = pageNum;
		loading = true;
		error = null;
		lineMap.clear();

		fetchMushafPage(fetch, p)
			.then((res) => {
				const temp: Record<number, LineWord[]> = {};
				for (const verse of res.verses) {
					for (const word of (verse.words ?? []) as Word[]) {
						const ln = word.lineNumber;
						if (!ln) continue;
						(temp[ln] ??= []).push({
							text: word.codeV2 ?? word.text ?? '',
							lineNumber: ln,
							verseKey: verse.verseKey,
							charTypeName: word.charTypeName,
							position: word.position
						});
					}
				}
				lineMap.clear();
				for (const k of Object.keys(temp).map(Number).sort((a, b) => a - b)) {
					lineMap.set(k, temp[k].sort((a, b) => a.position - b.position));
				}
			})
			.catch(() => { error = 'Failed to load page'; })
			.finally(() => { loading = false; });
	});

	const lineCount = $derived(readerState.mushafLines);
	const fontFamily = $derived(`p${pageNum}-v2`);
	const lines = $derived([...lineMap.entries()]);
</script>

<div class="mushaf-container select-none">
	{#if loading}
		<div class="flex justify-center pt-16">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if error}
		<p class="text-error text-center py-8">{error}</p>
	{:else if lines.length}
		<div class="mushaf-page bg-base-100 mx-auto py-6 px-4" style="max-width: 560px;">
			{#each lines as [lineNum, words] (lineNum)}
				<div
					class="mushaf-line flex justify-center items-baseline leading-none mb-1"
					dir="rtl"
					lang="ar"
					style="font-family: {fontFamily}, serif; font-size: {lineCount === 15 ? 1.5 : 1.4}rem; line-height: {lineCount === 15 ? 2.4 : 2.2};"
				>
					{#each words as word (`${word.verseKey}:${word.position}`)}
						<span>{word.text}</span>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<div class="flex justify-between items-center pt-6 pb-2 max-w-md mx-auto px-4">
		{#if pageNum > 1}
			<button class="btn btn-sm btn-ghost" onclick={() => (pageOffset -= 1)}>← Prev</button>
		{:else}
			<div></div>
		{/if}

		<div class="text-center">
			<span class="text-sm font-medium text-base-content/60">Page {pageNum}</span>
			<div class="flex gap-1 mt-1 justify-center">
				{#each ([15, 16] as const) as n (n)}
					<button
						class="btn btn-xs {lineCount === n ? 'btn-primary' : 'btn-ghost'}"
						onclick={() => readerState.setLines(n)}
					>{n} lines</button>
				{/each}
			</div>
		</div>

		{#if pageNum < 604}
			<button class="btn btn-sm btn-ghost" onclick={() => (pageOffset += 1)}>Next →</button>
		{:else}
			<div></div>
		{/if}
	</div>
</div>
