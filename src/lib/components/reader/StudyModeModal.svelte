<script lang="ts">
	import type {
		HadithItem,
		QuestionsResponse,
		ReflectionsResponse,
		TafsirContent,
		TafsirInfo
	} from '$lib/types/quran';
	import { readerState } from '$lib/state/reader.svelte';
	import {
		fetchTafsirContent,
		fetchAvailableTafsirs,
		fetchHadithsByAyah,
		fetchAnswersByAyah,
		fetchReflections
	} from '$lib/api/quran';
	import ReflectionsList from './ReflectionsList.svelte';

	export type StudyTab = 'tafsir' | 'lessons' | 'reflections' | 'answers' | 'hadith';

	interface Props {
		verseKey: string;
		tab: StudyTab;
		open: boolean;
		onClose: () => void;
		onTabChange: (tab: StudyTab) => void;
	}

	const { verseKey, tab, open, onClose, onTabChange }: Props = $props();

	const DEFAULT_TAFSIR_ID = 169;

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

	// ── Tafsir list ──────────────────────────────────────────────────────────────

	let allTafsirs = $state<TafsirInfo[]>([]);
	let tafsirListLoaded = $state(false);

	$effect(() => {
		if (!open || tab !== 'tafsir' || tafsirListLoaded) return;
		fetchAvailableTafsirs(fetch)
			.then((list) => {
				allTafsirs = list;
				tafsirListLoaded = true;
				if (!selectedLanguage) {
					const cur = list.find((t) => t.id === selectedTafsirId);
					if (cur) selectedLanguage = cur.languageName;
					else selectedLanguage = 'english';
				}
			})
			.catch(() => {});
	});

	const languageOptions = $derived(
		tafsirListLoaded ? [...new Set(allTafsirs.map((t) => t.languageName))].sort() : []
	);

	// ── Selected tafsir ──────────────────────────────────────────────────────────

	let selectedTafsirId = $state<number>(readerState.tafsirId ?? DEFAULT_TAFSIR_ID);
	let selectedLanguage = $state('');

	const filteredTafsirs = $derived(allTafsirs.filter((t) => t.languageName === selectedLanguage));

	function selectLanguage(lang: string) {
		selectedLanguage = lang;
		const first = allTafsirs.find((t) => t.languageName === lang);
		if (first) selectTafsir(first.id);
	}

	function selectTafsir(id: number) {
		selectedTafsirId = id;
		readerState.setTafsir(id);
	}

	// ── Tafsir content ───────────────────────────────────────────────────────────

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
			.then((c) => {
				tafsirContent = c;
			})
			.catch(() => {
				tafsirError = 'Failed to load tafsir.';
			})
			.finally(() => {
				tafsirLoading = false;
			});
	});

	// ── Hadith content ───────────────────────────────────────────────────────────

	let hadithLoading = $state(false);
	let hadithError = $state<string | null>(null);
	let hadithAllItems = $state<HadithItem[]>([]);
	let hadithHasMore = $state(false);
	let hadithPage = $state(1);
	let hadithLoadingMore = $state(false);
	let shownArabic = $state<Set<number>>(new Set());

	$effect(() => {
		if (!open || tab !== 'hadith') return;
		const key = verseKey;
		hadithError = null;
		hadithAllItems = [];
		hadithPage = 1;
		shownArabic = new Set();
		hadithLoading = true;
		fetchHadithsByAyah(fetch, key, 'en', 1, 10)
			.then((d) => {
				hadithAllItems = d.hadiths;
				hadithHasMore = d.hasMore;
				if (d.hadiths.length === 0) onTabChange(null as unknown as StudyTab);
			})
			.catch(() => {
				hadithError = 'Failed to load hadiths.';
			})
			.finally(() => {
				hadithLoading = false;
			});
	});

	function loadMoreHadiths() {
		hadithLoadingMore = true;
		hadithPage++;
		fetchHadithsByAyah(fetch, verseKey, 'en', hadithPage, 10)
			.then((d) => {
				hadithAllItems = [...hadithAllItems, ...d.hadiths];
				hadithHasMore = d.hasMore;
			})
			.catch(() => {})
			.finally(() => {
				hadithLoadingMore = false;
			});
	}

	function toggleArabic(urn: number) {
		const next = new Set(shownArabic);
		if (next.has(urn)) next.delete(urn);
		else next.add(urn);
		shownArabic = next;
	}

	function parseHadithNumbers(numStr: string): string[] {
		return numStr
			.split(/[,;]/)
			.map((s) => s.trim())
			.filter(Boolean);
	}

	// ── Reflections content ──────────────────────────────────────────────────────

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
			.then((d) => {
				reflectionsData = d;
			})
			.catch(() => {
				reflectionsError = 'Failed to load reflections.';
			})
			.finally(() => {
				reflectionsLoading = false;
			});
	});

	// ── Lessons content ──────────────────────────────────────────────────────────

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
			.then((d) => {
				lessonsData = d;
			})
			.catch(() => {
				lessonsError = 'Failed to load lessons.';
			})
			.finally(() => {
				lessonsLoading = false;
			});
	});

	// ── Answers content ──────────────────────────────────────────────────────────

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
			.then((d) => {
				answersData = d;
			})
			.catch(() => {
				answersError = 'Failed to load answers.';
			})
			.finally(() => {
				answersLoading = false;
			});
	});

	// ── Tabs ─────────────────────────────────────────────────────────────────────

	const tabs: { id: StudyTab; label: string }[] = [
		{ id: 'tafsir', label: 'Tafsirs' },
		{ id: 'lessons', label: 'Lessons' },
		{ id: 'reflections', label: 'Reflections' },
		{ id: 'answers', label: 'Answers' },
		{ id: 'hadith', label: 'Hadith' }
	];

	function displayLanguage(lang: string): string {
		return lang.charAt(0).toUpperCase() + lang.slice(1);
	}

	function getEnglishText(h: HadithItem): string | null {
		return h.hadith.find((t) => t.lang === 'en')?.body ?? null;
	}

	function getArabicText(h: HadithItem): string | null {
		return h.hadith.find((t) => t.lang === 'ar')?.body ?? null;
	}

	function getGrades(h: HadithItem): string {
		const en = h.hadith.find((t) => t.lang === 'en');
		if (!en || en.grades.length === 0) return '';
		return en.grades.map((g) => `${g.grade} (${g.gradedBy})`).join(', ');
	}

	let expandedAnswer = $state<string | null>(null);
	let expandedReflection = $state<Set<number>>(new Set());
	let expandedLessons = $state<Set<number>>(new Set());

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

	const TYPE_LABELS: Record<string, string> = {
		CLARIFICATION: 'Clarification',
		TAFSIR: 'Tafsir',
		COMMUNITY: 'Community',
		EXPLORE_ANSWERS: 'Explore Answers'
	};
</script>

<!-- modal-bottom on mobile, modal-middle on sm+ -->
<dialog bind:this={dialog} class="modal modal-bottom sm:modal-middle" onclose={onClose}>
	<div
		class="modal-box flex h-[95dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl bg-base-100 p-0 sm:h-[82dvh] sm:max-w-[min(80vw,1310px)] sm:rounded-2xl"
	>
		<!-- Drag handle (mobile only) -->
		<div class="flex shrink-0 justify-center pt-2.5 pb-1 sm:hidden">
			<div class="h-1 w-10 rounded-full bg-base-300"></div>
		</div>

		<!-- Header: verse key + close button -->
		<div class="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
			<span class="font-mono text-xs text-base-content/50 select-none">{verseKey}</span>
			<button class="btn btn-circle btn-ghost btn-sm" onclick={onClose} aria-label="Close">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Tab bar -->
		<div class="shrink-0 border-b border-base-200">
			<div class="flex scrollbar-none overflow-x-auto px-2" role="tablist" aria-label="Study tabs">
				{#each tabs as t (t.id)}
					<button
						role="tab"
						aria-selected={tab === t.id}
						class="shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
							{tab === t.id
							? 'border-primary text-primary'
							: 'border-transparent text-base-content/50 hover:text-base-content'}"
						onclick={() => onTabChange(t.id)}
					>
						{t.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Scrollable content area -->
		<div class="min-h-0 flex-1 overflow-y-auto" bind:this={contentEl}>
			{#if tab === 'tafsir'}
				<!-- Controls: language + tafsir selection -->
				{#if tafsirListLoaded}
					<div class="border-b border-base-200">
						<div class="flex items-center gap-3 px-4 py-2.5">
							<div class="dropdown dropdown-bottom">
								<button
									tabindex="0"
									class="hover:border-base-400 flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-sm text-base-content/70 transition-colors hover:text-base-content"
								>
									<span>{displayLanguage(selectedLanguage)}</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="m6 9 6 6 6-6" />
									</svg>
								</button>
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<ul
									tabindex="0"
									class="dropdown-content menu z-50 mt-1 max-h-64 min-w-40 flex-nowrap overflow-y-auto menu-sm rounded-lg border border-base-200 bg-base-100 p-1 shadow-lg"
								>
									<li
										class="menu-title px-2 pt-1 pb-0.5 text-[0.65rem] tracking-wide uppercase opacity-50"
									>
										Languages
									</li>
									{#each languageOptions as lang (lang)}
										<li>
											<button
												class="py-1.5 text-sm {selectedLanguage === lang ? 'active' : ''}"
												onclick={() => selectLanguage(lang)}
											>
												{displayLanguage(lang)}
											</button>
										</li>
									{/each}
								</ul>
							</div>
						</div>
						{#if filteredTafsirs.length > 0}
							<div class="flex scrollbar-none gap-1.5 overflow-x-auto px-4 pb-3">
								{#each filteredTafsirs as tafsir (tafsir.id)}
									<button
										class="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
											{selectedTafsirId === tafsir.id
											? 'border-primary bg-primary/10 text-primary'
											: 'border-base-200 text-base-content/60 hover:border-base-300 hover:text-base-content'}"
										onclick={() => selectTafsir(tafsir.id)}
									>
										{tafsir.translatedName?.name ?? tafsir.name}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if tafsirLoading}
					<div class="flex items-center justify-center py-16">
						<span class="loading loading-md loading-spinner text-primary"></span>
					</div>
				{:else if tafsirError}
					<p class="py-12 text-center text-sm text-error">{tafsirError}</p>
				{:else if tafsirContent}
					<div class="px-4 py-4">
						<p class="mb-3 text-xs tracking-wide text-base-content/40 uppercase">
							{tafsirContent.resourceName}
						</p>
						<div class="prose-sm prose max-w-none leading-relaxed text-base-content/80">
							{@html tafsirContent.text}
						</div>
					</div>
				{/if}
			{:else if tab === 'hadith'}
				{#if hadithLoading}
					<div class="flex items-center justify-center py-16">
						<span class="loading loading-md loading-spinner text-primary"></span>
					</div>
				{:else if hadithError}
					<div class="flex flex-col items-center justify-center gap-3 py-16">
						<p class="text-sm text-error">{hadithError}</p>
						<button class="btn btn-ghost btn-sm" onclick={() => (hadithAllItems = [])}>Retry</button
						>
					</div>
				{:else if hadithAllItems.length === 0}
					<div class="flex flex-col items-center justify-center gap-3 py-20 text-base-content/30">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						<p class="text-sm">No hadiths found for this verse</p>
					</div>
				{:else}
					<!-- Disclaimer -->
					<div class="border-b border-info/10 bg-info/5 px-4 py-3">
						<p class="text-xs leading-relaxed text-base-content/50">
							Hadiths are from
							<a
								href="https://sunnah.com/bukhari"
								target="_blank"
								rel="noopener noreferrer"
								class="text-info underline underline-offset-2">Sahih al-Bukhari</a
							>
							and
							<a
								href="https://sunnah.com/muslim"
								target="_blank"
								rel="noopener noreferrer"
								class="text-info underline underline-offset-2">Sahih Muslim</a
							>
							via sunnah.com
						</p>
					</div>
					<div class="divide-y divide-base-200">
						{#each hadithAllItems as h (h.urn)}
							<div class="px-4 py-4">
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<span class="text-xs font-semibold text-primary">{h.name}</span>
									{#each parseHadithNumbers(h.hadithNumber) as num, i (i)}
										<a
											href="https://sunnah.com/{h.collection}/{num}"
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-base-content/40 transition-colors hover:text-primary"
										>
											#{num}
										</a>
									{/each}
								</div>
								{#if getGrades(h)}
									<p class="mb-2 text-xs text-base-content/40">{getGrades(h)}</p>
								{/if}
								{#if getEnglishText(h)}
									<div class="prose-sm mb-3 prose max-w-none leading-relaxed text-base-content/80">
										{@html getEnglishText(h)?.replace(
											/<br\s*\/?>/gi,
											'<span class="block my-1"></span>'
										) ?? ''}
									</div>
								{/if}
								{#if getArabicText(h)}
									<button
										class="text-xs text-base-content/40 transition-colors select-none hover:text-base-content/60"
										onclick={() => toggleArabic(h.urn)}
										aria-expanded={shownArabic.has(h.urn)}
									>
										{shownArabic.has(h.urn) ? 'Hide Arabic' : 'Show Arabic'}
									</button>
									{#if shownArabic.has(h.urn)}
										<div
											class="prose-sm mt-2 prose max-w-none text-right font-[--font-arabic] leading-relaxed"
											dir="rtl"
											lang="ar"
										>
											{@html getArabicText(h)?.replace(
												/<br\s*\/?>/gi,
												'<span class="block my-1"></span>'
											) ?? ''}
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
					{#if hadithHasMore}
						<div class="flex justify-center py-4">
							<button
								class="btn btn-ghost btn-sm"
								onclick={loadMoreHadiths}
								disabled={hadithLoadingMore}
							>
								{#if hadithLoadingMore}
									<span class="loading loading-xs loading-spinner"></span>
									Loading...
								{:else}
									Load more
								{/if}
							</button>
						</div>
					{/if}
				{/if}
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
				{#if answersLoading}
					<div class="flex items-center justify-center py-16">
						<span class="loading loading-md loading-spinner text-primary"></span>
					</div>
				{:else if answersError}
					<div class="flex flex-col items-center justify-center gap-3 py-20 text-base-content/30">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
							/>
						</svg>
						<p class="text-sm text-base-content/50">Answers requires API auth scope</p>
						<p class="text-xs text-base-content/30">
							Request production auth access from Quran.Foundation
						</p>
					</div>
				{:else if answersData && answersData.questions.length === 0}
					<div class="flex flex-col items-center justify-center gap-3 py-20 text-base-content/30">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						<p class="text-sm">No answers found for this verse</p>
					</div>
				{:else if answersData}
					<div class="divide-y divide-base-200">
						{#each answersData.questions as q (q.id)}
							<div class="px-4 py-3">
								<button
									class="flex w-full items-start gap-2 text-left"
									onclick={() => toggleAnswer(q.id)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										class="mt-0.5 shrink-0 transition-transform {expandedAnswer === q.id
											? 'rotate-90'
											: ''}"
									>
										<path d="m9 18 6-6-6-6" />
									</svg>
									<div class="min-w-0 flex-1">
										<div class="mb-1 flex items-center gap-2">
											<span
												class="rounded px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide uppercase
												{q.type === 'CLARIFICATION'
													? 'bg-blue-500/10 text-blue-500'
													: q.type === 'TAFSIR'
														? 'bg-purple-500/10 text-purple-500'
														: 'bg-base-200 text-base-content/50'}"
											>
												{TYPE_LABELS[q.type] ?? q.type}
											</span>
										</div>
										<p class="text-sm leading-relaxed text-base-content/80">{q.body}</p>
									</div>
								</button>
								{#if expandedAnswer === q.id}
									<div class="pt-2 pl-6">
										{#each q.answers as a (a.id)}
											<div class="mb-3 border-l-2 border-primary/30 pl-3">
												<p
													class="mb-1.5 text-xs font-medium tracking-wide text-base-content/50 uppercase"
												>
													Answer
												</p>
												<div class="prose-sm prose max-w-none leading-relaxed text-base-content/80">
													{@html a.body}
												</div>
												{#if a.answeredBy}
													<p class="mt-1 text-xs text-base-content/40">
														Answered by {a.answeredBy}
													</p>
												{/if}
											</div>
										{/each}
										{#if q.summary}
											<div class="mb-2">
												<p
													class="mb-1 text-xs font-medium tracking-wide text-base-content/50 uppercase"
												>
													Summary
												</p>
												<p class="text-xs text-base-content/50 italic">{q.summary}</p>
											</div>
										{/if}
										{#if q.references && q.references.length > 0}
											<div>
												<p
													class="mb-1 text-xs font-medium tracking-wide text-base-content/50 uppercase"
												>
													References
												</p>
												<ul class="list-inside list-disc text-xs text-base-content/50">
													{#each q.references as ref, i (i)}
														<li>{ref}</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Backdrop closes modal -->
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
