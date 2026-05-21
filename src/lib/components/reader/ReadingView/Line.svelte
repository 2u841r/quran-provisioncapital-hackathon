<script lang="ts">
	import type { LineWord } from './types';

	interface Props {
		lineKey: string;
		words: LineWord[];
		fontFamily: string;
		fontSize: string;
		lineHeight: string | number;
		centerAlign?: boolean;
		isIndoPak?: boolean;
	}

	const { lineKey, words, fontFamily, fontSize, lineHeight, centerAlign = false, isIndoPak = false }: Props = $props();

	function verseNum(verseKey: string): string {
		const n = verseKey.split(':')[1] ?? '';
		return n.replace(/\d/g, d => String.fromCharCode(0x0660 + Number(d)));
	}
</script>

<div
	id={lineKey}
	class="mushaf-line flex items-baseline leading-none mb-1"
	class:justify-center={centerAlign}
	class:justify-between={!centerAlign}
	dir="rtl"
	lang="ar"
	data-page={lineKey.split('-')[0]?.replace('Page', '')}
	style="font-family: {fontFamily}, serif; font-size: {fontSize}; line-height: {lineHeight};"
>
	{#each words as word (`${word.verseKey}:${word.position}`)}
		{#if isIndoPak && word.charTypeName === 'end'}
			<span
				data-verse-key={word.verseKey}
				class="inline-flex items-center justify-center rounded-full border border-current mx-0.5 shrink-0"
				style="font-family: system-ui, sans-serif; font-size: 0.55em; width: 1.7em; height: 1.7em; vertical-align: middle;"
			>{verseNum(word.verseKey)}</span>
		{:else}
			<span data-verse-key={word.verseKey}>{word.text}</span>
		{/if}
	{/each}
</div>
