import pkg from 'humps';
const { camelizeKeys } = pkg;
import type { Chapter, ChaptersData, Verse, VersesResponse } from '$lib/types/quran';
import chaptersJson from '$lib/data/chapters.json';

// Direct public API (no translations without QF auth).
// Server load functions pass their event.fetch which routes through /api/proxy/content.
const PUBLIC_API = 'https://api.quran.com/api/v4';
const PROXY_API = '/api/proxy/content';

// Saheeh International (131)
const DEFAULT_TRANSLATION = 131;

function buildUrl(base: string, path: string, params: Record<string, string | number | boolean>): string {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		search.set(k, String(v));
	}
	return `${base}${path}?${search.toString()}`;
}

async function apiFetch<T>(
	fetchFn: typeof fetch,
	path: string,
	params: Record<string, string | number | boolean>
): Promise<T> {
	// SvelteKit server fetch resolves relative URLs; browser uses public API
	const base = typeof window === 'undefined' ? PROXY_API : PUBLIC_API;
	const url = buildUrl(base, path, params);
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`API error ${res.status} for ${url}`);
	const json = await res.json();
	return camelizeKeys(json) as T;
}

export function getChaptersData(): ChaptersData {
	const raw = chaptersJson as unknown as Record<string, Omit<Chapter, 'id'>>;
	const result: ChaptersData = {};
	for (const [id, ch] of Object.entries(raw)) {
		result[id] = { ...ch, id: Number(id) };
	}
	return result;
}

export async function fetchChapter(
	fetchFn: typeof fetch,
	chapterId: string | number
): Promise<Chapter> {
	const data = await apiFetch<{ chapter: Chapter }>(fetchFn, `/chapters/${chapterId}`, {
		language: 'en'
	});
	return data.chapter;
}

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

const VERSE_PARAMS = {
	translations: DEFAULT_TRANSLATION,
	translation_fields: 'resource_name,language_id',
	fields: 'text_indopak,text_imlaei_simple,chapter_id',
	words: true,
	word_fields: 'text_indopak,translation,transliteration'
} as const;

export async function fetchChapterVerses(
	fetchFn: typeof fetch,
	chapterId: string | number,
	page = 1,
	perPage = 50
): Promise<VersesResponse> {
	return apiFetch<VersesResponse>(fetchFn, `/verses/by_chapter/${chapterId}`, {
		...VERSE_PARAMS,
		page,
		per_page: perPage
	});
}

export async function fetchVerse(
	fetchFn: typeof fetch,
	chapterId: string | number,
	verseNumber: string | number
): Promise<Verse> {
	const data = await apiFetch<{ verse: Verse }>(
		fetchFn,
		`/verses/by_key/${chapterId}:${verseNumber}`,
		VERSE_PARAMS
	);
	return data.verse;
}

export async function fetchVerseRange(
	fetchFn: typeof fetch,
	chapterId: string | number,
	from: number,
	to: number
): Promise<VersesResponse> {
	return apiFetch<VersesResponse>(fetchFn, `/verses/by_chapter/${chapterId}`, {
		...VERSE_PARAMS,
		from: `${chapterId}:${from}`,
		to: `${chapterId}:${to}`,
		per_page: to - from + 1
	});
}
