<script lang="ts">
	import { readerState, type QuranFont } from '$lib/state/reader.svelte';
	import { audioState } from '$lib/state/audio.svelte';
	import type { AvailableTranslation, Reciter, TafsirInfo } from '$lib/types/quran';

	interface Props {
		translations: AvailableTranslation[];
		reciters: Reciter[];
		tafsirs: TafsirInfo[];
		open: boolean;
		onClose: () => void;
	}

	const { translations, reciters, tafsirs, open, onClose }: Props = $props();

	type Tab = 'arabic' | 'translation' | 'wbw';
	let activeTab = $state<Tab>('arabic');
	let reciterExpanded = $state(false);

	const displayFonts: { font: QuranFont; label: string }[] = [
		{ font: 'text_uthmani', label: 'Uthmani' },
		{ font: 'text_indopak', label: 'IndoPak' }
	];

	const previewArabic: Partial<Record<QuranFont, string>> = {
		text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
		text_uthmani_simple: 'بسم الله الرحمن الرحيم',
		text_indopak: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ'
	};

	const previewFontFamily = $derived(
		readerState.quranFont === 'text_indopak' ? "'IndoPak', serif" : "'Scheherazade New', 'Amiri', serif"
	);
	const previewText = $derived(previewArabic[readerState.quranFont] ?? previewArabic['text_uthmani']!);
	const previewFontSize = $derived(0.9 + (readerState.fontScale - 1) * 0.2);

	const selectedFontIdx = $derived(displayFonts.findIndex((f) => f.font === readerState.quranFont));

	const selectedReciterName = $derived(
		reciters.find((r) => r.id === audioState.reciterId)?.translatedName?.name ??
			reciters.find((r) => r.id === audioState.reciterId)?.name ??
			'Select Reciter'
	);

	function toggleTranslation(id: number) {
		const cur = readerState.selectedTranslations;
		if (cur.includes(id)) {
			readerState.setTranslations(cur.filter((t) => t !== id));
		} else {
			readerState.setTranslations([...cur, id]);
		}
	}

	const translationsByLang = $derived(
		translations.reduce<Record<string, AvailableTranslation[]>>((acc, t) => {
			const lang = t.languageName ?? 'Other';
			(acc[lang] ??= []).push(t);
			return acc;
		}, {})
	);

	const popularLangs = ['english', 'urdu', 'bengali', 'turkish', 'french', 'indonesian'];
	const sortedLangs = $derived([
		...popularLangs.filter((l) => translationsByLang[l]),
		...Object.keys(translationsByLang)
			.filter((l) => !popularLangs.includes(l))
			.sort()
	]);

	function reset() {
		readerState.setFont('text_indopak');
		readerState.setFontScale(3);
		readerState.setLines(15);
		readerState.setTranslations([131]);
		readerState.toggleWordByWord();
		if (readerState.wordByWord) readerState.toggleWordByWord();
	}
</script>

{#if open}
	<button class="fixed inset-0 bg-black/30 z-30" onclick={onClose} aria-label="Close settings"></button>
{/if}

<div
	class="fixed inset-y-0 right-0 w-full max-w-sm bg-base-100 border-l border-base-200 shadow-2xl z-40 flex flex-col transition-transform duration-200"
	class:translate-x-full={!open}
>
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-base-200 shrink-0">
		<h2 class="font-semibold text-base-content">Settings</h2>
		<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6 6 18M6 6l12 12"/>
			</svg>
		</button>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="flex border-b border-base-200 shrink-0">
		{#each ([['arabic','Arabic'],['translation','Translation'],['wbw','Word By Word']] as const) as [tab, label] (tab)}
			<button
				role="tab"
				aria-selected={activeTab === tab}
				class="flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 {activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content'}"
				onclick={() => { activeTab = tab; reciterExpanded = false; }}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Scrollable body -->
	<div class="flex-1 overflow-y-auto">
		<!-- Verse preview -->
		<div class="mx-4 mt-4 mb-2 border border-base-200 rounded-xl p-3 bg-base-200/30">
			<div class="text-[0.65rem] font-medium text-base-content/40 mb-2 uppercase tracking-wide">Preview</div>
			<div dir="rtl" lang="ar" class="mb-2 leading-relaxed" style="font-family: {previewFontFamily}; font-size: {previewFontSize}rem">
				{previewText}
			</div>
			<div class="text-xs text-base-content/60 leading-snug">
				In the Name of Allah—the Most Compassionate, Most Merciful.
			</div>
		</div>

		<!-- Arabic tab -->
		{#if activeTab === 'arabic'}
			<div class="px-4 pb-4 space-y-5 mt-3">

				<!-- Font switcher -->
				<div>
					<div class="text-xs font-medium text-base-content/50 mb-2">Quran Font</div>
					<div class="relative flex bg-base-200 rounded-lg p-0.5">
						<!-- Sliding bg -->
						<div
							class="absolute top-0.5 bottom-0.5 rounded-md bg-base-100 shadow-sm transition-transform duration-200 pointer-events-none"
							style="width: {100 / displayFonts.length}%; transform: translateX({(selectedFontIdx >= 0 ? selectedFontIdx : 0) * 100}%)"
						></div>
						{#each displayFonts as { font, label } (font)}
							<button
								class="flex-1 relative z-10 py-1.5 text-xs font-medium rounded-md transition-colors {readerState.quranFont === font ? 'text-base-content' : 'text-base-content/50 hover:text-base-content'}"
								onclick={() => readerState.setFont(font)}
							>
								{label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Lines -->
				<div>
					<div class="text-xs font-medium text-base-content/50 mb-2">Lines</div>
					<div class="relative">
						<select
							class="w-full appearance-none bg-base-200 rounded-lg px-3 py-2 text-sm text-base-content pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
							value={readerState.mushafLines}
							onchange={(e) => readerState.setLines(Number((e.target as HTMLSelectElement).value) as 15 | 16)}
						>
							<option value={15}>15 Lines</option>
							<option value={16}>16 Lines</option>
						</select>
						<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>

				<!-- Font size -->
				<div>
					<div class="text-xs font-medium text-base-content/50 mb-2">Font Size</div>
					<div class="flex items-center gap-3">
						<button
							class="btn btn-ghost btn-sm btn-circle border border-base-300"
							onclick={() => readerState.setFontScale(readerState.fontScale - 1)}
							disabled={readerState.fontScale <= 1}
							aria-label="Decrease"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15">
								<path fill="currentColor" fill-rule="evenodd" d="M2.25 7.5a.5.5 0 0 1 .5-.5h9.5a.5.5 0 0 1 0 1h-9.5a.5.5 0 0 1-.5-.5" clip-rule="evenodd"/>
							</svg>
						</button>
						<span class="text-sm font-semibold text-base-content w-4 text-center">{readerState.fontScale}</span>
						<button
							class="btn btn-ghost btn-sm btn-circle border border-base-300"
							onclick={() => readerState.setFontScale(readerState.fontScale + 1)}
							disabled={readerState.fontScale >= 5}
							aria-label="Increase"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15">
								<path fill="currentColor" fill-rule="evenodd" d="M8 2.75a.5.5 0 0 0-1 0V7H2.75a.5.5 0 0 0 0 1H7v4.25a.5.5 0 0 0 1 0V8h4.25a.5.5 0 0 0 0-1H8z" clip-rule="evenodd"/>
							</svg>
						</button>
					</div>
				</div>

				<!-- Reciter -->
				<div>
					<div class="text-xs font-medium text-base-content/50 mb-2">Reciter</div>
					<button
						class="w-full flex items-center justify-between border border-base-300 rounded-xl px-3 py-3 hover:bg-base-200 transition-colors text-left"
						onclick={() => (reciterExpanded = !reciterExpanded)}
					>
						<div>
							<div class="text-[0.65rem] text-base-content/40 uppercase tracking-wide">Selected Reciter</div>
							<div class="text-sm font-medium text-base-content mt-0.5 truncate max-w-[200px]">{selectedReciterName}</div>
						</div>
						<svg
							class="shrink-0 text-base-content/40 transition-transform {reciterExpanded ? 'rotate-90' : ''}"
							xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 15 15"
						>
							<path fill="currentColor" fill-rule="evenodd" d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 1 1-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 0 1 .023-.707" clip-rule="evenodd"/>
						</svg>
					</button>
					{#if reciterExpanded}
						<div class="mt-1 border border-base-200 rounded-xl overflow-y-auto max-h-52">
							{#each reciters as r (r.id)}
								<button
									class="w-full text-left px-3 py-2.5 text-sm transition-colors {audioState.reciterId === r.id ? 'text-primary font-medium bg-primary/5' : 'text-base-content hover:bg-base-200'}"
									onclick={() => { audioState.setReciter(r.id); reciterExpanded = false; }}
								>
									{r.translatedName?.name ?? r.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Tafsir -->
				<div>
					<div class="text-xs font-medium text-base-content/50 mb-2">Tafsir</div>
					<div class="relative">
						<select
							class="w-full appearance-none bg-base-200 rounded-lg px-3 py-2 text-sm text-base-content pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
							value={readerState.tafsirId ?? ''}
							onchange={(e) => {
								const v = (e.target as HTMLSelectElement).value;
								readerState.setTafsir(v ? Number(v) : null);
							}}
						>
							<option value="">None</option>
							{#each tafsirs as t (t.id)}
								<option value={t.id}>{t.translatedName?.name ?? t.name} ({t.languageName})</option>
							{/each}
						</select>
						<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>

			</div>

		<!-- Translation tab -->
		{:else if activeTab === 'translation'}
			<div class="px-4 pb-4 mt-3 space-y-1">
				{#each sortedLangs as lang (lang)}
					<details class="group">
						<summary class="flex items-center justify-between cursor-pointer py-2 text-sm font-medium text-base-content/70 capitalize select-none">
							<span>{lang}</span>
							<svg class="group-open:rotate-90 transition-transform text-base-content/30" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15">
								<path fill="currentColor" fill-rule="evenodd" d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 1 1-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 0 1 .023-.707" clip-rule="evenodd"/>
							</svg>
						</summary>
						<div class="pl-2 pb-2 space-y-1">
							{#each translationsByLang[lang] as tr (tr.id)}
								<label class="flex items-start gap-2.5 cursor-pointer group/item py-1">
									<input
										type="checkbox"
										class="checkbox checkbox-primary checkbox-xs mt-0.5 shrink-0"
										checked={readerState.selectedTranslations.includes(tr.id)}
										onchange={() => toggleTranslation(tr.id)}
									/>
									<span class="text-xs text-base-content/70 group-hover/item:text-base-content leading-tight">
										{tr.translatedName?.name ?? tr.name}
										<span class="text-base-content/40"> — {tr.authorName}</span>
									</span>
								</label>
							{/each}
						</div>
					</details>
				{/each}
			</div>

		<!-- Word By Word tab -->
		{:else}
			<div class="px-4 pb-4 mt-3 space-y-4">
				<div class="flex items-center justify-between py-2">
					<div>
						<div class="text-sm font-medium text-base-content">Word by Word Translation</div>
						<div class="text-xs text-base-content/50 mt-0.5">Show translation under each word</div>
					</div>
					<input
						type="checkbox"
						class="toggle toggle-primary toggle-sm"
						checked={readerState.wordByWord}
						onchange={() => readerState.toggleWordByWord()}
					/>
				</div>
				{#if readerState.wordByWord}
					<div>
						<div class="text-xs font-medium text-base-content/50 mb-2">Language</div>
						<div class="relative">
							<select
								class="w-full appearance-none bg-base-200 rounded-lg px-3 py-2 text-sm text-base-content pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
								value={readerState.wordByWordLocale}
								onchange={(e) => {/* TODO: add setWordByWordLocale to state */}}
							>
								<option value="en">English</option>
								<option value="ur">Urdu</option>
								<option value="bn">Bengali</option>
								<option value="tr">Turkish</option>
								<option value="id">Indonesian</option>
							</select>
							<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
								<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Footer: Reset + Done -->
	<div class="flex items-center justify-between px-4 py-3 border-t border-base-200 shrink-0 gap-3">
		<button class="btn btn-ghost btn-sm flex-1" onclick={reset}>Reset</button>
		<button class="btn btn-primary btn-sm flex-1" onclick={onClose}>Done</button>
	</div>
</div>
