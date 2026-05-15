export interface Chapter {
	id?: number | string;
	versesCount: number;
	bismillahPre: boolean;
	revelationOrder: number;
	revelationPlace: string;
	pages: number[];
	nameComplex: string;
	nameSimple: string;
	transliteratedName: string;
	nameArabic: string;
	translatedName: string;
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
}

export interface Verse {
	id: number;
	verseNumber: number;
	chapterId?: number | string;
	verseKey: string;
	textUthmani?: string;
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
