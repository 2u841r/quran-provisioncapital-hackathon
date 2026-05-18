<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { fetchMushafPage } from '$lib/api/quran';
	import { readerState } from '$lib/state/reader.svelte';
	import type { Chapter, Word } from '$lib/types/quran';
	import type { LineWord } from './ReadingView/types';
	import Page from './ReadingView/Page.svelte';
	import ChapterControls from './EndOfScrollingControls/ChapterControls.svelte';

	interface PageData {
		pageNumber: number;
		lineMap: SvelteMap<number, LineWord[]>;
		showChapterHeader: boolean;
	}

	interface Props {
		initialPage?: number;
		chapter: Chapter;
		onOpenTranslations?: () => void;
	}

	const { chapter, onOpenTranslations }: Props = $props();

	let loadedPages = $state<PageData[]>([]);
	let nextPageIdx = $state(0);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Plain (non-reactive) flag — no $state to avoid effect loops
	let isSentinelVisible = false;
	const pageFetchCache = new Map<number, Promise<PageData | null>>();
	const fontLoadCache = new Map<string, Promise<void>>();

	// chapter.pages from the API is [firstPage, lastPage] — a 2-element range, not a full list.
	// Expand to every page number in that range.
	const pageNumbers = $derived.by(() => {
		const p = chapter.pages ?? [];
		if (p.length < 2) return p;
		const first = p[0];
		const last = p[p.length - 1];
		return Array.from({ length: last - first + 1 }, (_, i) => first + i);
	});
	const allLoaded = $derived(nextPageIdx >= pageNumbers.length);

	function fontUrl(pageNum: number): string {
		return readerState.quranFont === 'tajweed_v4'
			? `/fonts/quran/hafs/v4/colrv1/woff2/p${pageNum}.woff2`
			: `/fonts-v2/p${pageNum}.woff2`;
	}

	function fontFamily(pageNum: number): string {
		return readerState.quranFont === 'tajweed_v4' ? `p${pageNum}-v4` : `p${pageNum}-v2`;
	}

	function injectFontFace(pageNum: number) {
		if (typeof document === 'undefined') return;
		const idV2 = `qcf-p${pageNum}-v2`;
		if (!document.getElementById(idV2)) {
			const s = document.createElement('style');
			s.id = idV2;
			s.textContent = `@font-face{font-family:p${pageNum}-v2;src:url('/fonts-v2/p${pageNum}.woff2') format('woff2');}`;
			document.head.appendChild(s);
		}
		const idV4 = `qcf-p${pageNum}-v4`;
		if (!document.getElementById(idV4)) {
			const s = document.createElement('style');
			s.id = idV4;
			s.textContent = `@font-face{font-family:p${pageNum}-v4;src:url('/fonts/quran/hafs/v4/colrv1/woff2/p${pageNum}.woff2') format('woff2');}`;
			document.head.appendChild(s);
		}
	}

	function preloadFont(pageNum: number): Promise<void> {
		if (typeof document === 'undefined') return Promise.resolve();

		const family = fontFamily(pageNum);
		const cached = fontLoadCache.get(family);
		if (cached) return cached;

		injectFontFace(pageNum);

		const url = fontUrl(pageNum);
		const linkId = `preload-${family}`;
		if (!document.getElementById(linkId)) {
			const link = document.createElement('link');
			link.id = linkId;
			link.rel = 'preload';
			link.as = 'font';
			link.type = 'font/woff2';
			link.href = url;
			link.crossOrigin = 'anonymous';
			document.head.appendChild(link);
		}

		const loadPromise = (async () => {
			if (!('FontFace' in window) || !document.fonts) return;
			const existing = [...document.fonts].find((font) => font.family === family);
			if (existing) {
				await existing.load();
			} else {
				const fontFace = new FontFace(family, `url('${url}') format('woff2')`);
				await fontFace.load();
				document.fonts.add(fontFace);
			}
			await document.fonts.ready;
		})().catch(() => {});

		fontLoadCache.set(family, loadPromise);
		return loadPromise;
	}

	function buildPageData(
		res: Awaited<ReturnType<typeof fetchMushafPage>>,
		pageNum: number,
		fetchChapterId: number
	): PageData | null {
		const temp: Record<number, LineWord[]> = {};
		for (const verse of res.verses) {
			const [vChapter] = verse.verseKey.split(':');
			if (Number(vChapter) !== fetchChapterId) continue;
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

		const lineNumbers = Object.keys(temp).map(Number);
		if (lineNumbers.length === 0) return null;

		const lineMap = new SvelteMap<number, LineWord[]>();
		for (const k of lineNumbers.sort((a, b) => a - b)) {
			lineMap.set(
				k,
				temp[k].sort((a, b) => a.position - b.position)
			);
		}

		const showChapterHeader = Object.values(temp).some((words) =>
			words.some((w) => w.verseKey === `${fetchChapterId}:1`)
		);

		return { pageNumber: pageNum, lineMap, showChapterHeader };
	}

	function preloadPage(pageNum: number, fetchChapterId = Number(chapter.id)) {
		if (pageFetchCache.has(pageNum)) return;
		pageFetchCache.set(
			pageNum,
			Promise.all([fetchMushafPage(fetch, pageNum), preloadFont(pageNum)]).then(([res]) =>
				buildPageData(res, pageNum, fetchChapterId)
			)
		);
	}

	async function loadNextPage() {
		const nums = pageNumbers;
		const idx = nextPageIdx;
		if (loading || idx >= nums.length) return;

		const fetchChapterId = Number(chapter.id);
		loading = true;
		error = null;

		const pageNum = nums[idx];
		preloadPage(pageNum, fetchChapterId);
		const preloadNextPageNum = nums[idx + 1];
		if (preloadNextPageNum) preloadPage(preloadNextPageNum, fetchChapterId);

		try {
			const pageData = await pageFetchCache.get(pageNum);

			if (Number(chapter.id) !== fetchChapterId) return;

			if (pageData) loadedPages = [...loadedPages, pageData];

			nextPageIdx = idx + 1;
		} catch {
			pageFetchCache.delete(pageNum);
			error = 'Failed to load page';
		} finally {
			loading = false;
		}

		// Self-chain: if sentinel is still visible after this page loaded
		// (e.g. page was short and didn't push sentinel off-screen), keep loading.
		if (isSentinelVisible && nextPageIdx < pageNumbers.length) {
			void loadNextPage();
		}
	}

	// Reset and kick off first load when chapter changes.
	// untrack prevents nextPageIdx/loading reads inside loadNextPage from
	// becoming dependencies of this effect — otherwise each page load
	// would re-trigger the reset, causing an infinite loop.
	$effect(() => {
		const _id = chapter.id;
		untrack(() => {
			loadedPages = [];
			nextPageIdx = 0;
			pageFetchCache.clear();
			fontLoadCache.clear();
			error = null;
			loading = false;
			void loadNextPage();
		});
	});

	// Svelte action for the sentinel div — receives the element directly,
	// no bind:this or $state needed, no extra $effect.
	function sentinel(el: HTMLElement) {
		const observer = new IntersectionObserver(
			([entry]) => {
				isSentinelVisible = entry.isIntersecting;
				if (entry.isIntersecting) void loadNextPage();
			},
			{ rootMargin: '1200px 0px' }
		);
		observer.observe(el);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	const lineCount = $derived(readerState.mushafLines);
</script>

<div class="mushaf-container select-none">
	{#each loadedPages as pageData (pageData.pageNumber)}
		<Page
			pageNumber={pageData.pageNumber}
			lineMap={pageData.lineMap}
			{chapter}
			showChapterHeader={pageData.showChapterHeader}
			{lineCount}
			fontFamily={fontFamily(pageData.pageNumber)}
			{onOpenTranslations}
		/>
	{/each}

	{#if allLoaded && loadedPages.length > 0}
		<ChapterControls chapterId={Number(chapter.id)} chapterName={chapter.nameSimple} />
	{/if}

	{#if error}
		<p class="py-4 text-center text-sm text-error">{error}</p>
	{/if}

	{#if !allLoaded}
		<div use:sentinel class="h-1 w-full" aria-hidden="true"></div>
		{#if loading}
			<div class="flex justify-center py-8">
				<span class="loading loading-md loading-spinner text-primary"></span>
			</div>
		{/if}
	{/if}
</div>
