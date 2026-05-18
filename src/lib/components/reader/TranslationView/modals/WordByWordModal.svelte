<script lang="ts">
  import { readerState } from '$lib/state/reader.svelte';
  import type { Word } from '$lib/types/quran';

  interface Props {
    verse: { verseKey: string; words: Word[]; pageNumber?: number };
    fontFamily: string;
    useWordGlyphs: boolean;
    isFontReady: boolean;
    open: boolean;
    onClose: () => void;
  }

  let { verse, fontFamily, useWordGlyphs, isFontReady, open, onClose }: Props = $props();

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

  const wbwWords = $derived(
    verse.words.filter((w) => w.charTypeName === 'word' || w.charTypeName === 'end')
  );
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label="Word by word"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="bg-base-100 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <h2 class="font-semibold">Word by Word — {verse.verseKey}</h2>
        <button class="btn btn-ghost btn-sm btn-circle" onclick={onClose}>✕</button>
      </div>
      <div class="p-5 flex flex-col gap-6">
        <!-- Translation section -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-3">
            Word by Word Translation
          </p>
          <div class="flex flex-wrap gap-x-3 gap-y-4" style="direction: rtl;">
            {#each wbwWords as word (word.position)}
              {@const wbwText = useWordGlyphs ? wordGlyph(word) : wordTextContent(word)}
              {@const wbwFont = useWordGlyphs ? wordFontFamily(word) : fontFamily}
              {#if word.charTypeName === 'end'}
                <div
                  class="flex flex-col items-center justify-start gap-0.5"
                  style="direction: rtl;"
                >
                  <span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};"
                    >{wbwText}</span
                  >
                </div>
              {:else}
                <div class="flex flex-col items-center gap-0.5 text-center max-w-[5rem]">
                  <span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};"
                    >{wbwText}</span
                  >
                  <span
                    class="text-[0.65rem] text-base-content/55 leading-tight w-full text-center"
                    >{word.translation?.text ?? ''}</span
                  >
                </div>
              {/if}
            {/each}
          </div>
        </div>
        <div class="border-t border-base-200"></div>
        <!-- Transliteration section -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-3">
            Word by Word Transliteration
          </p>
          <div class="flex flex-wrap gap-x-3 gap-y-4" style="direction: rtl;">
            {#each wbwWords as word (word.position)}
              {@const wbwText = useWordGlyphs ? wordGlyph(word) : wordTextContent(word)}
              {@const wbwFont = useWordGlyphs ? wordFontFamily(word) : fontFamily}
              {#if word.charTypeName === 'end'}
                <div
                  class="flex flex-col items-center justify-start gap-0.5"
                  style="direction: rtl;"
                >
                  <span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};"
                    >{wbwText}</span
                  >
                </div>
              {:else}
                <div class="flex flex-col items-center gap-0.5 text-center max-w-[5rem]">
                  <span class="text-xl leading-tight" lang="ar" style="font-family: {wbwFont};"
                    >{wbwText}</span
                  >
                  <span
                    class="text-[0.65rem] text-base-content/55 leading-tight italic w-full text-center"
                    >{word.transliteration?.text ?? ''}</span
                  >
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
