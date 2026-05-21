<script module lang="ts">
	export type { StudyTab } from './StudyModeModal/types';
</script>

<script lang="ts">
	import type {
		HadithItem,
		QuestionsResponse,
		ReflectionsResponse,
		TafsirContent,
		TafsirInfo,
		LayersResponse,
		QiraatResponse,
		RelatedVerse
	} from '$lib/types/quran';
	import { readerState } from '$lib/state/reader.svelte';
	import {
		fetchTafsirContent,
		fetchAvailableTafsirs,
		fetchHadithsByAyah,
		fetchAnswersByAyah,
		fetchReflections,
		fetchLayeredTranslations,
		fetchQiraat,
		fetchRelatedVerses
	} from '$lib/api/quran';
	import ReflectionsList from './ReflectionsList.svelte';
	import AnswersTab from './StudyModeModal/AnswersTab.svelte';
	import EmptyState from './StudyModeModal/EmptyState.svelte';
	import HadithTab from './StudyModeModal/HadithTab.svelte';
	import LayersTab from './StudyModeModal/LayersTab.svelte';
	import QiraatTab from './StudyModeModal/QiraatTab.svelte';
	import RelatedVersesTab from './StudyModeModal/RelatedVersesTab.svelte';
	import Header from './StudyModeModal/Header.svelte';
	import TabBar from './StudyModeModal/TabBar.svelte';
	import TafsirTab from './StudyModeModal/TafsirTab.svelte';
	import { STUDY_TABS, type StudyTab } from './StudyModeModal/types';
	import { fetchVerseTabCounts, type VerseTabCounts } from '$lib/api/quran';

	interface Props {
		verseKey: string;
		tab: StudyTab;
		open: boolean;
		onClose: () => void;
		onTabChange: (tab: StudyTab) => void;
		tabCounts?: VerseTabCounts | null;
	}

	const { verseKey, tab, open, onClose, onTabChange, tabCounts: tabCountsProp = null }: Props = $props();

	let tabCountsFetched = $state<VerseTabCounts | null>(null);
	let tabCountsFetchKey = '';

	$effect(() => {
		if (!open) return;
		const key = verseKey;
		if (tabCountsFetchKey === key) return;
		tabCountsFetchKey = key;
		tabCountsFetched = null;
		fetchVerseTabCounts(fetch, key).then((c) => { tabCountsFetched = c; }).catch(() => {});
	});

	const resolvedCounts = $derived(tabCountsProp ?? tabCountsFetched);

	const visibleTabs = $derived(
		resolvedCounts === null
			? STUDY_TABS
			: STUDY_TABS.filter((t) => {
					if (t.id === 'tafsir' || t.id === 'reflections' || t.id === 'lessons') return true;
					if (t.id === 'layers') return resolvedCounts.hasLayers;
					if (t.id === 'answers') return resolvedCounts.hasAnswers;
					if (t.id === 'qiraat') return resolvedCounts.hasQiraat;
					if (t.id === 'hadith') return resolvedCounts.hasHadith;
					if (t.id === 'related-verses') return resolvedCounts.hasRelatedVerses;
					return false;
			  })
	);

	const DEFAULT_TAFSIR_ID = 169;
	const HADITH_PAGE_SIZE = 10;

	let dialog = $state<HTMLDialogElement | null>(null);
	let contentEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	$effect(() => {
		if (open && contentEl) contentEl.scrollTop = 0;
	});

	const parts = $derived(verseKey.split(':'));
	const chapterId = $derived(Number(parts[0]));
	const verseNum = $derived(Number(parts[1]));

	let allTafsirs = $state<TafsirInfo[]>([]);
	let tafsirListLoaded = $state(false);

	$effect(() => {
		if (!open || tab !== 'tafsir' || tafsirListLoaded) return;
		fetchAvailableTafsirs(fetch)
			.then((list) => {
				allTafsirs = list;
				tafsirListLoaded = true;
				if (!selectedLanguage) {
					const current = list.find((tafsir) => tafsir.id === selectedTafsirId);
					selectedLanguage = current?.languageName ?? 'english';
				}
			})
			.catch(() => {});
	});

	const languageOptions = $derived(
		tafsirListLoaded ? [...new Set(allTafsirs.map((tafsir) => tafsir.languageName))].sort() : []
	);

	let selectedTafsirId = $state<number>(readerState.tafsirId ?? DEFAULT_TAFSIR_ID);
	let selectedLanguage = $state('');

	const filteredTafsirs = $derived(
		allTafsirs.filter((tafsir) => tafsir.languageName === selectedLanguage)
	);

	function selectLanguage(lang: string) {
		selectedLanguage = lang;
		const first = allTafsirs.find((tafsir) => tafsir.languageName === lang);
		if (first) selectTafsir(first.id);
	}

	function selectTafsir(id: number) {
		selectedTafsirId = id;
		readerState.setTafsir(id);
	}

	let tafsirContent = $state<TafsirContent | null>(null);
	let tafsirLoading = $state(false);
	let tafsirError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'tafsir') return;
		const key = verseKey;
		const id = selectedTafsirId;
		tafsirContent = null;
		tafsirError = null;
		tafsirLoading = true;
		fetchTafsirContent(fetch, id, key)
			.then((content) => {
				tafsirContent = content;
			})
			.catch(() => {
				tafsirError = 'Failed to load tafsir.';
			})
			.finally(() => {
				tafsirLoading = false;
			});
	});

	let hadithLoading = $state(false);
	let hadithError = $state<string | null>(null);
	let hadithAllItems = $state<HadithItem[]>([]);
	let hadithHasMore = $state(false);
	let hadithPage = $state(1);
	let hadithLoadingMore = $state(false);
	let shownArabic = $state<Set<number>>(new Set());

	$effect(() => {
		if (!open || tab !== 'hadith') return;
		loadHadiths(1);
	});

	function loadHadiths(page: number) {
		const key = verseKey;
		if (page === 1) {
			hadithError = null;
			hadithAllItems = [];
			hadithPage = 1;
			shownArabic = new Set();
			hadithLoading = true;
		} else {
			hadithLoadingMore = true;
		}

		fetchHadithsByAyah(fetch, key, 'en', page, HADITH_PAGE_SIZE)
			.then((data) => {
				hadithAllItems = page === 1 ? data.hadiths : [...hadithAllItems, ...data.hadiths];
				hadithHasMore = data.hasMore;
				hadithPage = page;
			})
			.catch(() => {
				if (page === 1) hadithError = 'Failed to load hadiths.';
			})
			.finally(() => {
				if (page === 1) hadithLoading = false;
				else hadithLoadingMore = false;
			});
	}

	function loadMoreHadiths() {
		if (hadithLoadingMore) return;
		loadHadiths(hadithPage + 1);
	}

	function toggleArabic(urn: number) {
		const next = new Set(shownArabic);
		if (next.has(urn)) next.delete(urn);
		else next.add(urn);
		shownArabic = next;
	}

	let reflectionsData = $state<ReflectionsResponse | null>(null);
	let reflectionsLoading = $state(false);
	let reflectionsError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'reflections') return;
		const ch = chapterId;
		const vn = verseNum;
		reflectionsData = null;
		reflectionsError = null;
		reflectionsLoading = true;
		fetchReflections(fetch, ch, vn, 1)
			.then((data) => {
				reflectionsData = data;
			})
			.catch(() => {
				reflectionsError = 'Failed to load reflections.';
			})
			.finally(() => {
				reflectionsLoading = false;
			});
	});

	let lessonsData = $state<ReflectionsResponse | null>(null);
	let lessonsLoading = $state(false);
	let lessonsError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'lessons') return;
		const ch = chapterId;
		const vn = verseNum;
		lessonsData = null;
		lessonsError = null;
		lessonsLoading = true;
		fetchReflections(fetch, ch, vn, 2)
			.then((data) => {
				lessonsData = data;
			})
			.catch(() => {
				lessonsError = 'Failed to load lessons.';
			})
			.finally(() => {
				lessonsLoading = false;
			});
	});

	let answersData = $state<QuestionsResponse | null>(null);
	let answersLoading = $state(false);
	let answersError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'answers') return;
		const key = verseKey;
		answersData = null;
		answersError = null;
		answersLoading = true;
		fetchAnswersByAyah(fetch, key, 'en', 1, 10)
			.then((data) => {
				answersData = data;
			})
			.catch(() => {
				answersError = 'Failed to load answers.';
			})
			.finally(() => {
				answersLoading = false;
			});
	});

	let expandedAnswer = $state<string | null>(null);
	let expandedReflection = $state<Set<number>>(new Set());
	let expandedLessons = $state<Set<number>>(new Set());

	// ─── Layers ──────────────────────────────────────────────────────────────────
	let layersData = $state<LayersResponse | null>(null);
	let layersLoading = $state(false);
	let layersError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'layers') return;
		const key = verseKey;
		layersData = null;
		layersError = null;
		layersLoading = true;
		fetchLayeredTranslations(fetch, key)
			.then((d) => { layersData = d ?? null; })
			.catch(() => { layersError = 'Failed to load layered translations.'; })
			.finally(() => { layersLoading = false; });
	});

	// ─── Qiraat ──────────────────────────────────────────────────────────────────
	let qiraatData = $state<QiraatResponse | null>(null);
	let qiraatLoading = $state(false);
	let qiraatError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'qiraat') return;
		const key = verseKey;
		qiraatData = null;
		qiraatError = null;
		qiraatLoading = true;
		fetchQiraat(fetch, key)
			.then((d) => { qiraatData = d ?? null; })
			.catch(() => { qiraatError = 'Failed to load Qiraat.'; })
			.finally(() => { qiraatLoading = false; });
	});

	// ─── Related Verses ──────────────────────────────────────────────────────────
	let relatedVersesItems = $state<RelatedVerse[]>([]);
	let relatedVersesLoading = $state(false);
	let relatedVersesError = $state<string | null>(null);

	$effect(() => {
		if (!open || tab !== 'related-verses') return;
		const key = verseKey;
		relatedVersesItems = [];
		relatedVersesError = null;
		relatedVersesLoading = true;
		fetchRelatedVerses(fetch, key)
			.then((d) => { relatedVersesItems = d?.relatedVerses ?? []; })
			.catch(() => { relatedVersesError = 'Failed to load related verses.'; })
			.finally(() => { relatedVersesLoading = false; });
	});

	function toggleAnswer(id: string) {
		expandedAnswer = expandedAnswer === id ? null : id;
	}

	function toggleReflectionExpand(id: number) {
		const next = new Set(expandedReflection);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedReflection = next;
	}

	function toggleLessonExpand(id: number) {
		const next = new Set(expandedLessons);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedLessons = next;
	}
</script>

<dialog bind:this={dialog} class="modal modal-bottom sm:modal-middle" onclose={onClose}>
	<div
		class="modal-box flex h-[95dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl bg-base-100 p-0 sm:h-[82dvh] sm:max-w-[min(80vw,1310px)] sm:rounded-2xl"
	>
		<Header {verseKey} {onClose} />
		<TabBar tabs={visibleTabs} activeTab={tab} {onTabChange} />

		<div class="min-h-0 flex-1 overflow-y-auto" bind:this={contentEl}>
			{#if tab === 'tafsir'}
				<TafsirTab
					listLoaded={tafsirListLoaded}
					{languageOptions}
					{selectedLanguage}
					{filteredTafsirs}
					{selectedTafsirId}
					content={tafsirContent}
					loading={tafsirLoading}
					error={tafsirError}
					onSelectLanguage={selectLanguage}
					onSelectTafsir={selectTafsir}
				/>
			{:else if tab === 'hadith'}
				<HadithTab
					items={hadithAllItems}
					loading={hadithLoading}
					error={hadithError}
					hasMore={hadithHasMore}
					loadingMore={hadithLoadingMore}
					{shownArabic}
					onRetry={() => loadHadiths(1)}
					onLoadMore={loadMoreHadiths}
					onToggleArabic={toggleArabic}
				/>
			{:else if tab === 'reflections'}
				<ReflectionsList
					data={reflectionsData}
					loading={reflectionsLoading}
					error={reflectionsError}
					accent="primary"
					label="Reflections"
					expandedIds={expandedReflection}
					onToggleExpand={toggleReflectionExpand}
				/>
			{:else if tab === 'lessons'}
				<ReflectionsList
					data={lessonsData}
					loading={lessonsLoading}
					error={lessonsError}
					accent="secondary"
					label="Lessons"
					expandedIds={expandedLessons}
					onToggleExpand={toggleLessonExpand}
				/>
			{:else if tab === 'answers'}
				<AnswersTab
					data={answersData}
					loading={answersLoading}
					error={answersError}
					{expandedAnswer}
					onToggleAnswer={toggleAnswer}
				/>
			{:else if tab === 'layers'}
				<LayersTab
					data={layersData}
					loading={layersLoading}
					error={layersError}
					onRetry={() => { layersData = null; layersError = null; layersLoading = true; fetchLayeredTranslations(fetch, verseKey).then(d => { layersData = d ?? null; }).catch(() => { layersError = 'Failed to load layered translations.'; }).finally(() => { layersLoading = false; }); }}
				/>
			{:else if tab === 'qiraat'}
				<QiraatTab
					data={qiraatData}
					loading={qiraatLoading}
					error={qiraatError}
					onRetry={() => { qiraatData = null; qiraatError = null; qiraatLoading = true; fetchQiraat(fetch, verseKey).then(d => { qiraatData = d ?? null; }).catch(() => { qiraatError = 'Failed to load Qiraat.'; }).finally(() => { qiraatLoading = false; }); }}
				/>
			{:else if tab === 'related-verses'}
				<RelatedVersesTab
					items={relatedVersesItems}
					loading={relatedVersesLoading}
					error={relatedVersesError}
					onRetry={() => { relatedVersesItems = []; relatedVersesError = null; relatedVersesLoading = true; fetchRelatedVerses(fetch, verseKey).then(d => { relatedVersesItems = d?.relatedVerses ?? []; }).catch(() => { relatedVersesError = 'Failed to load related verses.'; }).finally(() => { relatedVersesLoading = false; }); }}
					onNavigate={onClose}
				/>
			{/if}
		</div>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
