import pkg from 'humps';
const { camelizeKeys } = pkg;

import type {
	AvailableTranslation,
	Chapter,
	ChapterInfo,
	ChaptersData,
	HadithsResponse,
	QuestionsResponse,
	Reciter,
	ReflectionsResponse,
	SearchResponse,
	TafsirContent,
	TafsirInfo,
	Verse,
	VersesResponse
} from '$lib/types/quran';
import type { QuranFont } from '$lib/state/reader.svelte';
import chaptersJson from '$lib/data/chapters.json';

const PUBLIC_API = 'https://api.quran.com/api/v4';
const PROXY_API = '/api/proxy/content';

function buildUrl(
	base: string,
	path: string,
	params: Record<string, string | number | boolean | number[]>
): string {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (Array.isArray(v)) {
			search.set(k, v.join(','));
		} else {
			search.set(k, String(v));
		}
	}
	return `${base}${path}?${search.toString()}`;
}

// Verse endpoints need QDC gateway (auth required for translation data).
// gateway/ prefix is routed by our proxy to apis.quran.foundation/content/api/qdc/.
// All other resources (chapters, reciters, etc.) use the public API directly.
function verseBase(): string {
	return PROXY_API;
}

function versePath(path: string): string {
	// Strip leading slash then prepend gateway/ so the proxy routes to QDC
	return `/gateway/${path.replace(/^\//, '')}`;
}

async function apiFetch<T>(
	fetchFn: typeof fetch,
	path: string,
	params: Record<string, string | number | boolean | number[]> = {}
): Promise<T> {
	const base = typeof window === 'undefined' ? PROXY_API : PUBLIC_API;
	const url = buildUrl(base, path, params);
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`API error ${res.status} — ${url}`);
	const json = await res.json();
	return camelizeKeys(json) as T;
}

// Routes through our proxy → QDC gateway with auth (needed for translation data in verse responses)
async function gatewayFetch<T>(
	fetchFn: typeof fetch,
	path: string,
	params: Record<string, string | number | boolean | number[]> = {}
): Promise<T> {
	const url = buildUrl(verseBase(), versePath(path), params);
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`API error ${res.status} — ${url}`);
	const json = await res.json();
	return camelizeKeys(json) as T;
}

// ─── Chapters ────────────────────────────────────────────────────────────────

type RawChapter = {
	transliteratedName: string;
	translatedName: string;
	versesCount: number;
	revelationPlace: string;
	slug: string;
};

export function getChaptersData(): ChaptersData {
	const raw = chaptersJson as unknown as Record<string, RawChapter>;
	const result: ChaptersData = {};
	for (const [id, ch] of Object.entries(raw)) {
		result[id] = {
			id: Number(id),
			nameSimple: ch.transliteratedName,
			nameComplex: ch.transliteratedName,
			nameArabic: '',
			versesCount: ch.versesCount,
			revelationPlace: ch.revelationPlace,
			bismillahPre: Number(id) !== 9,
			revelationOrder: Number(id),
			pages: [],
			translatedName: { name: ch.translatedName, languageName: 'english' },
			slug: ch.slug
		};
	}
	return result;
}

export async function fetchChapter(fetchFn: typeof fetch, chapterId: string | number): Promise<Chapter> {
	const data = await apiFetch<{ chapter: Chapter }>(fetchFn, `/chapters/${chapterId}`, { language: 'en' });
	return data.chapter;
}

export async function fetchChapterInfo(fetchFn: typeof fetch, chapterId: string | number): Promise<ChapterInfo> {
	const data = await apiFetch<{ chapterInfo: ChapterInfo }>(fetchFn, `/chapters/${chapterId}/info`, { language: 'en' });
	return data.chapterInfo;
}

// ─── Validators ──────────────────────────────────────────────────────────────

export function isValidChapterId(id: string): boolean {
	const n = Number(id);
	return Number.isInteger(n) && n >= 1 && n <= 114;
}

export function isValidVerseNumber(verseId: string): boolean {
	const n = Number(verseId);
	return Number.isInteger(n) && n >= 1;
}

export function isValidVerseRange(verseId: string): boolean {
	return /^\d+-\d+$/.test(verseId);
}

// ─── Verse params ─────────────────────────────────────────────────────────────

// Mushaf IDs per quran.com API (drives the `word.text` field formatting)
const FONT_MUSHAF: Record<QuranFont, number> = {
	code_v2: 1,         // QCFV2
	code_v1: 2,         // QCFV1
	tajweed_v4: 19,     // QCFTajweedV4
	text_uthmani: 4,    // UthmaniHafs
	text_uthmani_simple: 4,
	text_indopak: 3     // Indopak
};

function verseParams(font: QuranFont, translations: number[], wordByWord = false, _mushafLines: 15 | 16 = 15) {
	// tajweed_v4 uses same glyph codes as code_v2
	const wordFont = font === 'tajweed_v4' ? 'code_v2' : font;
	const fields = [font, 'text_uthmani', 'text_indopak', 'text_imlaei_simple', 'chapter_id', 'page_number', 'juz_number', 'hizb_number'].join(',');
	// Always fetch all text variants so client-side font switching works without a re-fetch
	const wordFields = [
		'verse_key',
		'page_number',
		'location',
		'text_indopak',
		'text_uthmani',
		'text',
		'text_imlaei_simple',
		'code_v2',
		...(wordFont !== 'code_v2' && !['text_indopak', 'text_uthmani', 'text', 'text_imlaei_simple'].includes(wordFont) ? [wordFont] : []),
		'translation,transliteration'
	].filter(Boolean).join(',');
	return {
		translations: translations,
		translation_fields: 'resource_name,language_id',
		fields,
		words: true,
		word_fields: wordFields,
		mushaf: FONT_MUSHAF[font] ?? 4
	};
}

// ─── Verses ───────────────────────────────────────────────────────────────────

export async function fetchChapterVerses(
	fetchFn: typeof fetch,
	chapterId: string | number,
	font: QuranFont,
	translations: number[],
	wordByWord = false,
	page = 1,
	perPage = 50,
	mushafLines: 15 | 16 = 15
): Promise<VersesResponse> {
	return gatewayFetch<VersesResponse>(fetchFn, `/verses/by_chapter/${chapterId}`, {
		...verseParams(font, translations, wordByWord, mushafLines),
		page,
		per_page: perPage
	});
}

export async function fetchVerse(
	fetchFn: typeof fetch,
	chapterId: string | number,
	verseNumber: string | number,
	font: QuranFont,
	translations: number[]
): Promise<Verse> {
	const data = await gatewayFetch<{ verse: Verse }>(
		fetchFn,
		`/verses/by_key/${chapterId}:${verseNumber}`,
		verseParams(font, translations, true)
	);
	return data.verse;
}

export async function fetchVerseRange(
	fetchFn: typeof fetch,
	chapterId: string | number,
	from: number,
	to: number,
	font: QuranFont,
	translations: number[]
): Promise<VersesResponse> {
	return gatewayFetch<VersesResponse>(fetchFn, `/verses/by_chapter/${chapterId}`, {
		...verseParams(font, translations),
		from: `${chapterId}:${from}`,
		to: `${chapterId}:${to}`,
		per_page: to - from + 1
	});
}

export async function fetchJuzVerses(
	fetchFn: typeof fetch,
	juzId: string | number,
	font: QuranFont,
	translations: number[],
	page = 1,
	perPage = 50
): Promise<VersesResponse> {
	return gatewayFetch<VersesResponse>(fetchFn, `/verses/by_juz/${juzId}`, {
		...verseParams(font, translations),
		page,
		per_page: perPage
	});
}

export async function fetchMushafPage(
	fetchFn: typeof fetch,
	pageId: number | string
): Promise<VersesResponse> {
	return gatewayFetch<VersesResponse>(fetchFn, `/verses/by_page/${pageId}`, {
		words: true,
		word_fields: 'code_v2,line_number,page_number,position,char_type_name',
		fields: 'verse_key,chapter_id,page_number',
		per_page: 50
	});
}

export async function fetchPageVerses(
	fetchFn: typeof fetch,
	pageId: string | number,
	font: QuranFont,
	translations: number[]
): Promise<VersesResponse> {
	return gatewayFetch<VersesResponse>(fetchFn, `/verses/by_page/${pageId}`, {
		...verseParams(font, translations),
		per_page: 50
	});
}

// ─── Translations / Reciters / Tafsirs ───────────────────────────────────────

export async function fetchAvailableTranslations(fetchFn: typeof fetch): Promise<AvailableTranslation[]> {
	const data = await apiFetch<{ translations: AvailableTranslation[] }>(fetchFn, '/resources/translations', { language: 'en' });
	return data.translations;
}

export async function fetchReciters(fetchFn: typeof fetch): Promise<Reciter[]> {
	const data = await apiFetch<{ recitations: Reciter[] }>(fetchFn, '/resources/recitations', { language: 'en' });
	return data.recitations;
}

export async function fetchAvailableTafsirs(fetchFn: typeof fetch): Promise<TafsirInfo[]> {
	const data = await apiFetch<{ tafsirs: TafsirInfo[] }>(fetchFn, '/resources/tafsirs', { language: 'en' });
	return data.tafsirs;
}

export async function fetchTafsirContent(
	fetchFn: typeof fetch,
	tafsirId: number,
	verseKey: string
): Promise<TafsirContent> {
	const data = await apiFetch<{ tafsir: TafsirContent }>(
		fetchFn,
		`/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
		{ language: 'en' }
	);
	return data.tafsir;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function fetchSearch(
	fetchFn: typeof fetch,
	query: string,
	page = 1,
	translations: number[] = [131]
): Promise<SearchResponse> {
	return apiFetch<SearchResponse>(fetchFn, '/search', {
		q: query,
		size: 20,
		page,
		translations
	});
}

// ─── Gateway proxy fetch (hadiths, answers, reflections) ────────────────────────

async function apiFetchProxy<T>(
	fetchFn: typeof fetch,
	path: string,
	params: Record<string, string | number | boolean | number[]> = {}
): Promise<T> {
	const url = buildUrl(PROXY_API, path, params);
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`API error ${res.status}`);
	const json = await res.json();
	return camelizeKeys(json) as T;
}

// ─── Hadiths ────────────────────────────────────────────────────────────────────

export async function fetchHadithsByAyah(
	fetchFn: typeof fetch,
	verseKey: string,
	language: string = 'en',
	page: number = 1,
	limit: number = 10
): Promise<HadithsResponse> {
	return apiFetchProxy<HadithsResponse>(
		fetchFn,
		`/gateway/hadith_references/by_ayah/${verseKey}/hadiths`,
		{ language, page, limit }
	);
}

// ─── Answers ────────────────────────────────────────────────────────────────────

export async function fetchAnswersByAyah(
	fetchFn: typeof fetch,
	verseKey: string,
	language: string = 'en',
	page: number = 1,
	pageSize: number = 10
): Promise<QuestionsResponse> {
	return apiFetchProxy<QuestionsResponse>(
		fetchFn,
		`/auth/questions/by-verse/${verseKey}`,
		{ language, page, pageSize }
	);
}

// ─── Reflections / Lessons ──────────────────────────────────────────────────────

export async function fetchReflections(
	fetchFn: typeof fetch,
	chapterId: number,
	verseNumber: number,
	postTypeId: number,
	page: number = 1,
	languageId: number = 2
): Promise<ReflectionsResponse> {
	return apiFetchProxy<ReflectionsResponse>(
		fetchFn,
		'/quran-reflect/v1/posts/feed',
		{
			'filter[references][0][chapterId]': chapterId,
			'filter[references][0][from]': verseNumber,
			'filter[references][0][to]': verseNumber,
			'filter[postTypeIds]': postTypeId,
			page,
			tab: 'popular',
			languages: languageId,
			'filter[verifiedOnly]': true
		}
	);
}
