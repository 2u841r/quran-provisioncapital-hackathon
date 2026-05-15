<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';

	const previewByFont: Record<string, string> = {
		text_indopak: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ',
		text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
		text_uthmani_simple: 'بسم الله الرحمن الرحيم'
	};

	const fontFamilyMap: Record<string, string> = {
		text_indopak: "'IndoPak', serif",
		text_uthmani: "'UthmanicHafs', 'NotoNaskhArabic', serif",
		text_uthmani_simple: "'UthmanicHafs', 'NotoNaskhArabic', serif"
	};

	const arabicText = $derived(previewByFont[readerState.quranFont] ?? previewByFont['text_uthmani']);
	const fontFamily = $derived(fontFamilyMap[readerState.quranFont] ?? fontFamilyMap['text_uthmani']);
	const fontSize = $derived(0.9 + (readerState.fontScale - 1) * 0.2);
</script>

<div class="text-[0.65rem] font-medium text-base-content/40 mb-2 uppercase tracking-wide">Preview:</div>
<div dir="rtl" lang="ar" class="mb-2 leading-relaxed" style="font-family: {fontFamily}; font-size: {fontSize}rem;">
	{arabicText}
</div>
<div class="text-xs text-base-content/60 leading-snug">
	In the Name of Allah—the Most Compassionate, Most Merciful.
</div>
