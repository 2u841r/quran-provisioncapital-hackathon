<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';

	const previewByFont: Record<string, string> = {
		text_indopak: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ',
		text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
		text_uthmani_simple: 'بسم الله الرحمن الرحيم',
		code_v2: 'ﱁﱂﱃﱄﱅ',
		tajweed_v4: 'ﱁﱂﱃﱄﱅ'
	};

	const fontFamilyMap: Record<string, string> = {
		text_indopak: "'IndoPak', serif",
		text_uthmani: "'UthmanicHafs', 'NotoNaskhArabic', serif",
		text_uthmani_simple: "'UthmanicHafs', 'NotoNaskhArabic', serif",
		code_v2: 'p1-v2, serif',
		tajweed_v4: 'p1-v4, serif'
	};

	const arabicText = $derived(previewByFont[readerState.quranFont] ?? previewByFont['text_uthmani']);
	const fontFamily = $derived(fontFamilyMap[readerState.quranFont] ?? fontFamilyMap['text_uthmani']);
	const fontSize = $derived(0.9 + (readerState.fontScale - 1) * 0.2);

	// Inject QCF page-1 font-face(s) for preview and mark loaded in shared state
	$effect(() => {
		if (typeof document === 'undefined') return;
		const entries: Array<{ id: string; family: string; css: string }> = [];
		if (readerState.quranFont === 'tajweed_v4') entries.push({ id: 'qcf-p1-v4', family: 'p1-v4', css: `@font-face{font-family:p1-v4;src:url('/fonts/quran/hafs/v4/colrv1/woff2/p1.woff2') format('woff2');}` });
		if (readerState.quranFont === 'code_v2') entries.push({ id: 'qcf-p1-v2', family: 'p1-v2', css: `@font-face{font-family:p1-v2;src:url('/fonts-v2/p1.woff2') format('woff2');}` });
		for (const { id, family, css } of entries) {
			if (!document.getElementById(id)) {
				const s = document.createElement('style');
				s.id = id;
				s.textContent = css;
				document.head.appendChild(s);
			}
			document.fonts.load(`1em "${family}"`)
				.then(() => readerState.markFontLoaded(family))
				.catch(() => {});
		}
	});
</script>

<div class="text-[0.65rem] font-medium text-base-content/40 mb-2 uppercase tracking-wide">Preview:</div>
<div dir="rtl" lang="ar" class="mb-2 leading-relaxed" style="font-family: {fontFamily}; font-size: {fontSize}rem;">
	{arabicText}
</div>
<div class="text-xs text-base-content/60 leading-snug">
	In the Name of Allah—the Most Compassionate, Most Merciful.
</div>
