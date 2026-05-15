export interface Chapter {
	id?: number | string;
	versesCount: number;
	bismillahPre: boolean;
	revelationOrder: number;
	revelationPlace: string;
	pages: number[];
	nameComplex: string;
	nameSimple: string;
	nameArabic: string;
	translatedName: { name: string; languageName: string };
	slug?: string;
}

export interface Translation {
	id?: number;
	languageName: string;
	text: string;
	resourceName?: string | null;
	resourceId?: number;
	authorName?: string;
}

export interface Word {
	position: number;
	charTypeName: string;
	textUthmani?: string;
	textIndopak?: string;
	qpcUthmaniHafs?: string;
	text?: string;
	translation?: Translation;
	transliteration?: { text: string };
}

export interface Verse {
	id: number;
	verseNumber: number;
	chapterId?: number | string;
	verseKey: string;
	pageNumber?: number;
	juzNumber?: number;
	hizbNumber?: number;
	textUthmani?: string;
	textUthmaniSimple?: string;
	textIndopak?: string;
	textImlaeiSimple?: string;
	words: Word[];
	translations?: Translation[];
}

export interface Pagination {
	perPage: number;
	currentPage: number;
	nextPage: number | null;
	totalRecords: number;
	totalPages: number;
}

export interface VersesResponse {
	pagination: Pagination;
	verses: Verse[];
}

export interface ChapterResponse {
	chapter: Chapter;
}

export type ChaptersData = Record<string, Chapter>;

export interface AvailableTranslation {
	id: number;
	name: string;
	authorName: string;
	languageName: string;
	translatedName?: { name: string };
}

export interface Reciter {
	id: number;
	name: string;
	recitationStyle?: string;
	translatedName?: { name: string; languageName: string };
	relativePath?: string;
}

export interface TafsirInfo {
	id: number;
	name: string;
	authorName: string;
	languageName: string;
	translatedName?: { name: string };
}

export interface TafsirContent {
	verseKey: string;
	text: string;
	resourceName: string;
	languageName: string;
}

export interface ChapterInfo {
	id: number;
	chapterId: number;
	languageName: string;
	shortText: string;
	text: string;
	source: string;
}

export interface SearchResult {
	verseKey: string;
	verseId: number;
	text: string;
	words: Word[];
	translations?: Translation[];
}

export interface SearchResponse {
	search: {
		query: string;
		totalResults: number;
		currentPage: number;
		totalPages: number;
		results: SearchResult[];
	};
}
