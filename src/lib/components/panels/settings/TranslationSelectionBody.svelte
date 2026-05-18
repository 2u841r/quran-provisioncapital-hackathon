<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import type { AvailableTranslation } from '$lib/types/quran';

	interface Props {
		translations: AvailableTranslation[];
		onTranslationChange?: () => void;
	}

	const { translations, onTranslationChange }: Props = $props();

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

	let applyTimer: ReturnType<typeof setTimeout> | null = null;

	function toggle(id: number) {
		const cur = readerState.selectedTranslations;
		readerState.setTranslations(
			cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]
		);
		if (applyTimer) clearTimeout(applyTimer);
		applyTimer = setTimeout(() => { onTranslationChange?.(); }, 400);
	}
</script>

<div class="flex-1 overflow-y-auto px-4 translation-scroll">
	{#each sortedLangs as lang (lang)}
		<div class="py-2">
			<div class="py-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50 border-b border-base-200 mb-1">
				{lang}
			</div>
			{#each byLang[lang] as tr (tr.id)}
				<label class="flex items-start gap-3 cursor-pointer py-2 group/item">
					<input
						type="checkbox"
						class="checkbox checkbox-primary checkbox-xs mt-0.5 shrink-0"
						checked={readerState.selectedTranslations.includes(tr.id)}
						onchange={() => toggle(tr.id)}
					/>
					<span class="text-xs text-base-content leading-tight">
						{tr.translatedName?.name ?? tr.name}
						<span class="text-base-content/70"> — {tr.authorName}</span>
					</span>
				</label>
			{/each}
		</div>
	{/each}
</div>

<style>
	.translation-scroll {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}
	.translation-scroll::-webkit-scrollbar { width: 6px; }
	.translation-scroll::-webkit-scrollbar-track { background: transparent; }
	.translation-scroll::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}
</style>
