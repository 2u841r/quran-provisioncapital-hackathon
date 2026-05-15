<script lang="ts">
	import { readerState, fontLabels, type QuranFont } from '$lib/state/reader.svelte';
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

	const fonts: QuranFont[] = ['text_indopak', 'text_uthmani', 'text_uthmani_simple', 'code_v1', 'code_v2'];

	function toggleTranslation(id: number) {
		const cur = readerState.selectedTranslations;
		if (cur.includes(id)) {
			readerState.setTranslations(cur.filter((t) => t !== id));
		} else {
			readerState.setTranslations([...cur, id]);
		}
	}

	// Group translations by language
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
		...Object.keys(translationsByLang).filter((l) => !popularLangs.includes(l)).sort()
	]);
</script>

<!-- Backdrop -->
{#if open}
	<button
		class="fixed inset-0 bg-black/30 z-30"
		onclick={onClose}
		aria-label="Close settings"
	></button>
{/if}

<div
	class="fixed inset-y-0 right-0 w-full max-w-sm bg-base-100 border-l border-base-200 shadow-2xl z-40 flex flex-col transition-transform duration-200"
	class:translate-x-full={!open}
>
	<div class="flex items-center justify-between px-4 py-3 border-b border-base-200">
		<h2 class="font-semibold text-base-content">Reader Settings</h2>
		<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6 6 18M6 6l12 12"/>
			</svg>
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-6">

		<!-- Font -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">Quran Font</h3>
			<div class="flex flex-col gap-1">
				{#each fonts as font (font)}
					<button
						class="btn btn-sm justify-start"
						class:btn-primary={readerState.quranFont === font}
						class:btn-ghost={readerState.quranFont !== font}
						onclick={() => readerState.setFont(font)}
					>
						{fontLabels[font]}
					</button>
				{/each}
			</div>
		</section>

		<!-- Font scale -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">
				Font Size — {readerState.fontScale}
			</h3>
			<input
				type="range"
				min="1"
				max="5"
				value={readerState.fontScale}
				oninput={(e) => readerState.setFontScale(Number((e.target as HTMLInputElement).value))}
				class="range range-primary range-sm w-full"
			/>
		</section>

		<!-- Reading mode -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">Reading Mode</h3>
			<div class="join w-full">
				<button
					class="btn join-item flex-1 btn-sm"
					class:btn-primary={readerState.readingMode === 'translation'}
					onclick={() => readerState.setReadingMode('translation')}
				>Translation</button>
				<button
					class="btn join-item flex-1 btn-sm"
					class:btn-primary={readerState.readingMode === 'reading'}
					onclick={() => readerState.setReadingMode('reading')}
				>Reading</button>
			</div>
		</section>

		<!-- Word by word -->
		<section>
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide">Word by Word</h3>
				<input
					type="checkbox"
					class="toggle toggle-primary toggle-sm"
					checked={readerState.wordByWord}
					onchange={() => readerState.toggleWordByWord()}
				/>
			</div>
		</section>

		<!-- Reciter -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">Reciter</h3>
			<select
				class="select select-bordered select-sm w-full"
				value={audioState.reciterId}
				onchange={(e) => audioState.setReciter(Number((e.target as HTMLSelectElement).value))}
			>
				{#each reciters as r (r.id)}
					<option value={r.id}>{r.translatedName?.name ?? r.name}</option>
				{/each}
			</select>
		</section>

		<!-- Tafsir -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">Tafsir</h3>
			<select
				class="select select-bordered select-sm w-full"
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
		</section>

		<!-- Translations -->
		<section>
			<h3 class="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">Translations</h3>
			{#each sortedLangs as lang (lang)}
				<details class="mb-1">
					<summary class="cursor-pointer text-sm text-base-content/70 py-1 capitalize">{lang}</summary>
					<div class="pl-2 mt-1 space-y-1">
						{#each translationsByLang[lang] as tr (tr.id)}
							<label class="flex items-start gap-2 cursor-pointer group">
								<input
									type="checkbox"
									class="checkbox checkbox-primary checkbox-xs mt-0.5 shrink-0"
									checked={readerState.selectedTranslations.includes(tr.id)}
									onchange={() => toggleTranslation(tr.id)}
								/>
								<span class="text-xs text-base-content/70 group-hover:text-base-content leading-tight">
									{tr.translatedName?.name ?? tr.name}
									<span class="text-base-content/40"> — {tr.authorName}</span>
								</span>
							</label>
						{/each}
					</div>
				</details>
			{/each}
		</section>

	</div>
</div>
