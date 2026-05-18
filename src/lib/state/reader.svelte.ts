export type QuranFont =
	| 'text_indopak'
	| 'text_uthmani'
	| 'text_uthmani_simple'
	| 'code_v1'
	| 'code_v2'
	| 'tajweed_v4';

export type ReadingMode = 'translation' | 'reading';
export type ReadingSubMode = 'arabic' | 'translation';
export type MushafLines = 15 | 16;

const STORAGE_KEY = 'quran_reader_prefs';

const DEFAULTS = {
	quranFont: 'text_indopak' as QuranFont,
	mushafLines: 15 as MushafLines,
	readingMode: 'translation' as ReadingMode,
	readingSubMode: 'arabic' as ReadingSubMode,
	selectedTranslations: [131] as number[], // Saheeh International
	selectedReciter: 7, // Mishary Rashid Alafasy
	wordByWord: false,
	wordByWordLocale: 'en',
	tafsirId: null as number | null,
	fontScale: 3, // 1-5
	autoScroll: true,
	showTooltipWhenPlaying: false
};

function loadFromStorage(): typeof DEFAULTS {
	if (typeof localStorage === 'undefined') return DEFAULTS;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return DEFAULTS;
		return { ...DEFAULTS, ...JSON.parse(saved) };
	} catch {
		return DEFAULTS;
	}
}

function saveToStorage(prefs: typeof DEFAULTS) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function createReaderState() {
	let prefs = $state(loadFromStorage());
	let loadedFontFaces = $state<string[]>([]);

	function update<K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) {
		prefs = { ...prefs, [key]: value };
		saveToStorage(prefs);
	}

	return {
		get quranFont() { return prefs.quranFont; },
		get mushafLines() { return prefs.mushafLines; },
		get readingMode() { return prefs.readingMode; },
		get readingSubMode() { return prefs.readingSubMode; },
		// show translations when in verse-by-verse mode OR reading+translation sub-mode
		get showTranslations() {
			return prefs.readingMode === 'translation' || prefs.readingSubMode === 'translation';
		},
		get selectedTranslations() { return prefs.selectedTranslations; },
		get selectedReciter() { return prefs.selectedReciter; },
		get wordByWord() { return prefs.wordByWord; },
		get wordByWordLocale() { return prefs.wordByWordLocale; },
		get tafsirId() { return prefs.tafsirId; },
		get fontScale() { return prefs.fontScale; },
		get autoScroll() { return prefs.autoScroll; },
		get showTooltipWhenPlaying() { return prefs.showTooltipWhenPlaying; },

		get loadedFontFaces() { return loadedFontFaces; },
		markFontLoaded: (key: string) => {
			if (!loadedFontFaces.includes(key)) loadedFontFaces = [...loadedFontFaces, key];
		},

		setFont: (f: QuranFont) => update('quranFont', f),
		setLines: (l: MushafLines) => update('mushafLines', l),
		setReadingMode: (m: ReadingMode) => update('readingMode', m),
		setReadingSubMode: (s: ReadingSubMode) => update('readingSubMode', s),
		setTranslations: (ids: number[]) => update('selectedTranslations', ids),
		setReciter: (id: number) => update('selectedReciter', id),
		toggleWordByWord: () => update('wordByWord', !prefs.wordByWord),
		setTafsir: (id: number | null) => update('tafsirId', id),
		setFontScale: (s: number) => update('fontScale', Math.max(1, Math.min(5, s))),
		toggleAutoScroll: () => update('autoScroll', !prefs.autoScroll),
		toggleShowTooltipWhenPlaying: () => update('showTooltipWhenPlaying', !prefs.showTooltipWhenPlaying)
	};
}

export const readerState = createReaderState();

// Font field name used in API calls
export function fontField(font: QuranFont): string {
	return font; // API field names match our enum values
}

// CSS font-family for each font
export const fontFamilyMap: Record<QuranFont, string> = {
	text_indopak: "'IndoPak', serif",
	text_uthmani: "'UthmanicHafs', 'NotoNaskhArabic', serif",
	text_uthmani_simple: "'UthmanicHafs', 'NotoNaskhArabic', serif",
	code_v1: "'QCFv1', serif",
	code_v2: "'QCFv2', serif",
	tajweed_v4: "serif"
};

export const fontLabels: Record<QuranFont, string> = {
	text_indopak: 'IndoPak',
	text_uthmani: 'Uthmani',
	text_uthmani_simple: 'Uthmani Simple',
	code_v1: 'QCF v1',
	code_v2: 'QCF v2',
	tajweed_v4: 'Tajweed'
};
