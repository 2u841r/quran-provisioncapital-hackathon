<script lang="ts">
	import type { Verse } from '$lib/types/quran';

	interface Props {
		verse: Verse;
		highlight?: boolean;
	}

	const { verse, highlight = false }: Props = $props();

	const translation = $derived(verse.translations?.[0]);

	const wordTranslation = $derived(
		!translation && verse.words?.length
			? verse.words
					.filter((w) => w.charTypeName === 'word' && w.translation?.text)
					.map((w) => w.translation!.text)
					.join(' ') || null
			: null
	);
</script>

<div class="py-6 px-4 border-b border-base-200" class:bg-base-200={highlight}>
	<div class="text-xs font-semibold text-base-content/40 mb-3 tracking-wide">{verse.verseKey}</div>
	<div class="text-right text-[1.75rem] leading-[3] font-[IndoPak] text-base-content mb-3" dir="rtl" lang="ur">
		{verse.textIndopak ?? verse.textImlaeiSimple ?? ''}
	</div>
	{#if translation}
		<div class="text-base leading-relaxed text-base-content/80">{translation.text}</div>
	{:else if wordTranslation}
		<div class="text-base leading-relaxed text-base-content/60 italic">{wordTranslation}</div>
	{/if}
</div>
