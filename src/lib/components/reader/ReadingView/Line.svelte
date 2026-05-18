<script lang="ts">
	import type { LineWord } from './types';

	interface Props {
		lineKey: string;
		words: LineWord[];
		fontFamily: string;
		fontSize: string;
		lineHeight: string | number;
	}

	const { lineKey, words, fontFamily, fontSize, lineHeight }: Props = $props();
</script>

<div
	id={lineKey}
	class="mushaf-line flex justify-center items-baseline leading-none mb-1"
	dir="rtl"
	lang="ar"
	data-page={lineKey.split('-')[0]?.replace('Page', '')}
	style="font-family: {fontFamily}, serif; font-size: {fontSize}; line-height: {lineHeight};"
>
	{#each words as word (`${word.verseKey}:${word.position}`)}
		<span data-verse-key={word.verseKey}>{word.text}</span>
	{/each}
</div>
