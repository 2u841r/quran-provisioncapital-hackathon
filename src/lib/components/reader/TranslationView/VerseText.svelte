<script lang="ts">
  import { readerState } from '$lib/state/reader.svelte';
  import type { Word } from '$lib/types/quran';

  interface Props {
    verse: {
      verseNumber: number;
      verseKey: string;
      pageNumber?: number;
      words: Word[];
      textIndopak?: string;
      textUthmani?: string;
      textUthmaniSimple?: string;
      textImlaeiSimple?: string;
    };
    arabicText: string;
    fontFamily: string;
    fontSize: number;
    useWordGlyphs: boolean;
    isFontReady: boolean;
  }

  let { verse, arabicText, fontFamily, fontSize, useWordGlyphs, isFontReady }: Props = $props();

  function wordFontFamily(word: { pageNumber?: number }): string {
    const pg = word.pageNumber ?? (verse.pageNumber ?? 1);
    if (readerState.quranFont === 'code_v2') return `p${pg}-v2`;
    if (readerState.quranFont === 'code_v1') return `p${pg}-v1`;
    if (readerState.quranFont === 'tajweed_v4') return `p${pg}-v4`;
    return fontFamily;
  }

  function wordGlyph(word: { codeV2?: string; codeV1?: string }): string {
    if (readerState.quranFont === 'code_v2') return word.codeV2 ?? '';
    if (readerState.quranFont === 'code_v1') return word.codeV1 ?? '';
    if (readerState.quranFont === 'tajweed_v4') return word.codeV2 ?? '';
    return '';
  }

  function wordTextContent(
    word: { text?: string; textIndopak?: string; textUthmani?: string },
    stripEnd = false
  ): string {
    const text =
      readerState.quranFont === 'text_indopak'
        ? (word.textIndopak ?? word.text ?? '')
        : (word.text ?? word.textUthmani ?? '');
    if (!stripEnd) return text;
    return text.replace(/[۔-ۭ][٠-٩\d]*\s*$/u, '').trimEnd();
  }

  function toArabicNumerals(n: number): string {
    return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
  }

  const lineHeight = $derived(2.5 + readerState.fontScale * 0.2);
  const isIndoPak = $derived(readerState.quranFont === 'text_indopak');
  const renderedWords = $derived(
    useWordGlyphs
      ? verse.words.filter((w) => w.charTypeName !== 'pause')
      : verse.words.filter((w) => w.charTypeName === 'word')
  );
  const waqfIndicators = $derived.by(() => {
    const ends = verse.words.filter((w) => w.charTypeName === 'end');
    return ends
      .slice(0, -1)
      .map((w) => w.textIndopak ?? w.text ?? '')
      .join('');
  });
</script>

<!-- Arabic text -->
<div class="text-right mt-2 md:mt-3 mb-3" dir="rtl" lang="ar">
  {#if verse.words?.length}
    <div
      class="flex flex-wrap justify-start gap-x-1 items-baseline"
      style="font-size: {fontSize}rem; line-height: {lineHeight}"
    >
      {#each renderedWords as word, i (word.position)}
        {#if useWordGlyphs && isFontReady}
          <span style="font-family: {wordFontFamily(word)};">{wordGlyph(word)}</span>
        {:else if useWordGlyphs}
          <span style="font-family: 'UthmanicHafs', 'NotoNaskhArabic', serif;"
            >{word.textUthmani ?? word.text ?? word.textImlaeiSimple ?? ''}</span
          >
        {:else}
          <span style="font-family: {fontFamily};"
            >{wordTextContent(word, isIndoPak && i === renderedWords.length - 1)}</span
          >
        {/if}
      {/each}
      {#if isIndoPak}
        <span
          class="relative inline-block"
          style="width: 1.6em; height: 1.6em; font-size: 0.55em; transform: translateY(7px);"
        >
          <span
            class="absolute inset-0 flex items-center justify-center rounded-full border border-current"
            style="border-width: 1.5px; line-height: 1;"
          >
            <span style="font-size: 0.7em;">{toArabicNumerals(verse.verseNumber)}</span>
          </span>
          {#if waqfIndicators}
            <span
              class="absolute left-0 right-0 text-center"
              style="bottom: 95%; font-family: {fontFamily}; font-size: 1.3em; line-height: 1; transform: translateX(-0.4em);"
              >{waqfIndicators}</span
            >
          {/if}
        </span>
      {/if}
    </div>
  {:else}
    <p style="font-family: {fontFamily}; font-size: {fontSize}rem; line-height: {lineHeight}">
      {arabicText}
    </p>
  {/if}
</div>

<!-- Word-by-word inline (non-QCF fonts) -->
{#if readerState.wordByWord && !useWordGlyphs && verse.words?.length}
  <div class="flex flex-wrap gap-2 mb-3 justify-end" dir="rtl">
    {#each verse.words.filter((w) => w.charTypeName === 'word') as word (word.position)}
      <div class="text-center">
        <div class="text-sm text-base-content" dir="rtl">
          {word.textIndopak ?? word.textUthmani ?? word.text}
        </div>
        {#if word.translation}
          <div class="text-[0.6rem] text-base-content/50">{word.translation.text}</div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
