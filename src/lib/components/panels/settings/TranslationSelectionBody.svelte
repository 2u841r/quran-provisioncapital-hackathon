<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { AvailableTranslation } from '$lib/types/quran';

	interface Props {
		translations: AvailableTranslation[];
	}

	const { translations }: Props = $props();

	const popularLangs = ['english', 'urdu', 'bengali', 'turkish', 'french', 'indonesian'];

	const byLang = $derived(
		translations.reduce<Record<string, AvailableTranslation[]>>((acc, t) => {
			const lang = t.languageName ?? 'Other';
			(acc[lang] ??= []).push(t);
			return acc;
		}, {})
	);

	const sortedLangs = $derived([
		...popularLangs.filter((l) => byLang[l]),
		...Object.keys(byLang).filter((l) => !popularLangs.includes(l)).sort()
	]);

	function toggle(id: number) {
		const cur = readerState.selectedTranslations;
		readerState.setTranslations(
			cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]
		);
	}
</script>

<div class="flex-1 overflow-y-auto px-4 py-2">
	{#each sortedLangs as lang (lang)}
		<details class="group">
			<summary class="flex items-center justify-between cursor-pointer py-2.5 text-sm font-medium text-base-content/70 capitalize select-none border-b border-base-200">
				<span>{lang}</span>
				<svg class="group-open:rotate-90 transition-transform text-base-content/30" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15">
					<path fill="currentColor" fill-rule="evenodd" d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 1 1-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 0 1 .023-.707" clip-rule="evenodd"/>
				</svg>
			</summary>
			<div class="py-1">
				{#each byLang[lang] as tr (tr.id)}
					<label class="flex items-start gap-3 cursor-pointer py-2 group/item">
						<input
							type="checkbox"
							class="checkbox checkbox-primary checkbox-xs mt-0.5 shrink-0"
							checked={readerState.selectedTranslations.includes(tr.id)}
							onchange={() => toggle(tr.id)}
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
