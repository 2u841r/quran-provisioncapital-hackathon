<script lang="ts">
	import type { TafsirContent, TafsirInfo } from '$lib/types/quran';
	import { readerState } from '$lib/state/reader.svelte';
	import { fetchTafsirContent, fetchAvailableTafsirs } from '$lib/api/quran';

	export type StudyTab = 'tafsir' | 'lessons' | 'reflections' | 'answers' | 'hadith';

	interface Props {
		verseKey: string;
		tab: StudyTab;
		open: boolean;
		onClose: () => void;
		onTabChange: (tab: StudyTab) => void;
	}

	const { verseKey, tab, open, onClose, onTabChange }: Props = $props();

	const DEFAULT_TAFSIR_ID = 169; // Ibn Kathir (English)

	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	// ── Tafsir list ──────────────────────────────────────────────────────────────

	let allTafsirs = $state<TafsirInfo[]>([]);
	let tafsirListLoaded = $state(false);

	$effect(() => {
		if (!open || tab !== 'tafsir' || tafsirListLoaded) return;
		fetchAvailableTafsirs(fetch)
			.then((list) => {
				allTafsirs = list;
				tafsirListLoaded = true;
				// init language from current tafsir
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

	const filteredTafsirs = $derived(
		allTafsirs.filter((t) => t.languageName === selectedLanguage)
	);

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
			.then((c) => { tafsirContent = c; })
			.catch(() => { tafsirError = 'Failed to load tafsir.'; })
			.finally(() => { tafsirLoading = false; });
	});

	// ── Tabs ─────────────────────────────────────────────────────────────────────

	const tabs: { id: StudyTab; label: string }[] = [
		{ id: 'tafsir',       label: 'Tafsirs' },
		{ id: 'lessons',      label: 'Lessons' },
		{ id: 'reflections',  label: 'Reflections' },
		{ id: 'answers',      label: 'Answers' },
		{ id: 'hadith',       label: 'Hadith' },
	];

	function displayLanguage(lang: string): string {
		return lang.charAt(0).toUpperCase() + lang.slice(1);
	}
</script>

<!-- modal-bottom on mobile, modal-middle on sm+ -->
<dialog
	bind:this={dialog}
	class="modal modal-bottom sm:modal-middle"
	onclose={onClose}
>
	<div class="modal-box rounded-t-2xl sm:rounded-2xl p-0 flex flex-col h-[95dvh] sm:h-[82dvh] max-w-none sm:max-w-[min(80vw,1310px)] w-full overflow-hidden bg-base-100">

		<!-- Drag handle (mobile only) -->
		<div class="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
			<div class="w-10 h-1 rounded-full bg-base-300"></div>
		</div>

		<!-- Header: verse key + close button -->
		<div class="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
			<span class="text-xs font-mono text-base-content/50 select-none">{verseKey}</span>
			<button
				class="btn btn-ghost btn-sm btn-circle"
				onclick={onClose}
				aria-label="Close"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6 6 18M6 6l12 12"/>
				</svg>
			</button>
		</div>

		<!-- Tab bar -->
		<div class="shrink-0 border-b border-base-200">
			<div class="flex overflow-x-auto px-2 scrollbar-none" role="tablist" aria-label="Study tabs">
				{#each tabs as t (t.id)}
					<button
						role="tab"
						aria-selected={tab === t.id}
						class="px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0
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
		<div class="flex-1 overflow-y-auto min-h-0">
			{#if tab === 'tafsir'}
				<!-- Controls: language + tafsir selection -->
				{#if tafsirListLoaded}
					<div class="border-b border-base-200">
						<!-- Controls row: language dropdown -->
						<div class="flex items-center gap-3 px-4 py-2.5">
							<div class="dropdown dropdown-bottom">
								<button
									tabindex="0"
									class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-base-300 bg-base-100 text-sm text-base-content/70 hover:border-base-400 hover:text-base-content transition-colors"
								>
									<span>{displayLanguage(selectedLanguage)}</span>
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="m6 9 6 6 6-6"/>
									</svg>
								</button>
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<ul tabindex="0" class="dropdown-content menu menu-sm bg-base-100 border border-base-200 rounded-lg shadow-lg z-50 min-w-40 max-h-64 overflow-y-auto flex-nowrap mt-1 p-1">
									<li class="menu-title text-[0.65rem] uppercase tracking-wide opacity-50 px-2 pt-1 pb-0.5">Languages</li>
									{#each languageOptions as lang (lang)}
										<li>
											<button
												class="text-sm py-1.5 {selectedLanguage === lang ? 'active' : ''}"
												onclick={() => selectLanguage(lang)}
											>
												{displayLanguage(lang)}
											</button>
										</li>
									{/each}
								</ul>
							</div>
						</div>
						<!-- Tafsir selector row -->
						{#if filteredTafsirs.length > 0}
							<div class="flex overflow-x-auto gap-1.5 px-4 pb-3 scrollbar-none">
								{#each filteredTafsirs as tafsir (tafsir.id)}
									<button
										class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
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

				<!-- Tafsir content -->
				{#if tafsirLoading}
					<div class="flex justify-center items-center py-16">
						<span class="loading loading-spinner loading-md text-primary"></span>
					</div>
				{:else if tafsirError}
					<p class="text-error text-sm text-center py-12">{tafsirError}</p>
				{:else if tafsirContent}
					<div class="px-4 py-4">
						<p class="text-xs text-base-content/40 mb-3 uppercase tracking-wide">{tafsirContent.resourceName}</p>
						<div class="prose prose-sm max-w-none text-base-content/80 leading-relaxed">
							{@html tafsirContent.text}
						</div>
					</div>
				{/if}
			{:else}
				<div class="flex flex-col items-center justify-center py-20 gap-3 text-base-content/30">
					<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
					</svg>
					<p class="text-sm">{tabs.find(t => t.id === tab)?.label} — coming soon</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Backdrop closes modal -->
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
