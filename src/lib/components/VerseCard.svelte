<script lang="ts">
	import type { Verse } from '$lib/types/quran';

	interface Props {
		verse: Verse;
		highlight?: boolean;
	}

	const { verse, highlight = false }: Props = $props();

	const translation = $derived(verse.translations?.[0]);

	// Fallback: join word-level translations when verse-level translation unavailable
	const wordTranslation = $derived(
		!translation && verse.words?.length
			? verse.words
					.filter((w) => w.charTypeName === 'word' && w.translation?.text)
					.map((w) => w.translation!.text)
					.join(' ') || null
			: null
	);
</script>

<div class="verse-card" class:highlight>
	<div class="verse-number">{verse.verseKey}</div>
	<div class="arabic" dir="rtl" lang="ur">
		{verse.textIndopak ?? verse.textImlaeiSimple ?? ''}
	</div>
	{#if translation}
		<div class="translation">{translation.text}</div>
	{:else if wordTranslation}
		<div class="translation word-translation">{wordTranslation}</div>
	{/if}
</div>

<style>
	.verse-card {
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.verse-card.highlight {
		background: #fefce8;
	}

	.verse-number {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		letter-spacing: 0.05em;
	}

	.arabic {
		font-size: 1.75rem;
		line-height: 3;
		font-family: 'IndoPak', serif;
		color: #111827;
	}

	.translation {
		font-size: 1rem;
		line-height: 1.75;
		color: #374151;
	}

	.word-translation {
		color: #6b7280;
		font-style: italic;
	}
</style>
