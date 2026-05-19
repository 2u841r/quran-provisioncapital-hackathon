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
	textImlaeiSimple?: string;
	qpcUthmaniHafs?: string;
	codeV2?: string;
	codeV1?: string;
	text?: string;
	lineNumber?: number;
	pageNumber?: number;
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
	reciterName: string;
	style?: string;
	translatedName?: { name: string; languageName: string };
}

export interface TafsirInfo {
	id: number;
	slug: string;
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

// QF gateway search result (navigation item)
export interface SearchResult {
	resultType: string;
	key: string | number;
	name: string;       // translation text, may contain <em> highlights
	arabic?: string;    // Arabic text, may contain <em> highlights
	isArabic?: boolean;
	isTransliteration?: boolean;
}

export interface SearchResponse {
	result: {
		navigation: SearchResult[];
		verses: SearchResult[];
	};
	pagination: {
		totalRecords: number;
		currentPage: number;
		totalPages: number;
	};
}

// ─── Hadith ────────────────────────────────────────────────────────────────────

export interface HadithGrade {
	grade: string;
	gradedBy: string;
}

export interface HadithText {
	lang: string;
	chapterNumber: string;
	chapterTitle: string;
	body: string;
	urn: number;
	grades: HadithGrade[];
}

export interface HadithItem {
	urn: number;
	collection: string;
	bookNumber: string;
	chapterId: string;
	hadithNumber: string;
	name: string;
	hadith: HadithText[];
}

export interface HadithsResponse {
	hadiths: HadithItem[];
	page: number;
	limit: number;
	hasMore: boolean;
	language: string;
	direction: string;
}

// ─── Reflections / Lessons ─────────────────────────────────────────────────────

export interface ReflectionAuthor {
	id: string;
	username: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	verified?: boolean;
}

export interface ReflectionReference {
	id: string;
	chapterId: number;
	from: number;
	to: number;
}

export interface ReflectionItem {
	id: number;
	authorId: string;
	body: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	commentsCount: number;
	likesCount: number;
	viewsCount: number;
	languageName: string;
	postTypeId: number;
	postTypeName: string;
	author?: ReflectionAuthor;
	references?: ReflectionReference[];
	verified?: boolean;
}

export interface ReflectionsResponse {
	total: number;
	currentPage: number;
	limit: number;
	pages: number;
	data: ReflectionItem[];
}

// ─── Answers (Questions & Answers) ─────────────────────────────────────────────

export interface Answer {
	id: string;
	body: string;
	answeredBy: string | null;
	status: string;
	language: string | null;
}

export interface Question {
	id: string;
	body: string;
	type: string;
	ranges: string[];
	surah: number;
	theme: string[] | null;
	summary: string | null;
	references: string[] | null;
	language: string | null;
	status: string;
	answers: Answer[];
}

export interface QuestionsResponse {
	questions: Question[];
	totalCount: number;
}

// ─── Layered Translations ───────────────────────────────────────────────────────

export interface LayersToken {
	type: 'text' | 'alt_group';
	html?: string;
	groupKey?: string;
}

export interface LayersOption {
	optionKey: string;
	collapsedHtml: string;
	expandedHtml: string;
}

export interface LayersGroup {
	groupKey: string;
	defaultOptionKey: string;
	explanationHtml: string | null;
	options: LayersOption[];
}

export interface LayersResponse {
	resource: { name: string; description?: string };
	collapsedTokens: LayersToken[];
	expandedTokens: LayersToken[];
	groups: LayersGroup[];
}

// ─── Qiraat ─────────────────────────────────────────────────────────────────────

export interface QiraatReading {
	id: number;
	position: number;
	text: string;
	textUthmani: string;
	color: string;
	translation: string | null;
	explanation: { text: string } | null;
}

export interface QiraatJuncture {
	id: number;
	position: number;
	text: string;
	readings: QiraatReading[];
}

export interface QiraatResponse {
	junctures: QiraatJuncture[];
}

// ─── Related Verses ──────────────────────────────────────────────────────────────

export interface RelatedVerse {
	id: number;
	verseKey: string;
	relation: string;
	chapterName: string;
}

export interface RelatedVersesResponse {
	relatedVerses: RelatedVerse[];
	pagination: { nextPage: number | null; totalRecords: number };
}
