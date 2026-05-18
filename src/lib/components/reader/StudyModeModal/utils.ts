import type { HadithItem } from '$lib/types/quran';

export const ANSWER_TYPE_LABELS: Record<string, string> = {
	CLARIFICATION: 'Clarification',
	TAFSIR: 'Tafsir',
	COMMUNITY: 'Community',
	EXPLORE_ANSWERS: 'Explore Answers'
};

export function displayLanguage(lang: string): string {
	return lang.charAt(0).toUpperCase() + lang.slice(1);
}

export function getEnglishText(hadith: HadithItem): string | null {
	return hadith.hadith.find((text) => text.lang === 'en')?.body ?? null;
}

export function getArabicText(hadith: HadithItem): string | null {
	return hadith.hadith.find((text) => text.lang === 'ar')?.body ?? null;
}

export function getGrades(hadith: HadithItem): string {
	const englishText = hadith.hadith.find((text) => text.lang === 'en');
	if (!englishText || englishText.grades.length === 0) return '';
	return englishText.grades.map((grade) => `${grade.grade} (${grade.gradedBy})`).join(', ');
}

export function parseHadithNumbers(numStr: string): string[] {
	return numStr
		.split(/[,;]/)
		.map((num) => num.trim())
		.filter(Boolean);
}

export function formatHtmlBreaks(html: string | null): string {
	return html?.replace(/<br\s*\/?>/gi, '<span class="block my-1"></span>') ?? '';
}
