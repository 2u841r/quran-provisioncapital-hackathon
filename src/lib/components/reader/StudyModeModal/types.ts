export type StudyTab = 'tafsir' | 'lessons' | 'reflections' | 'answers' | 'hadith' | 'layers' | 'qiraat' | 'related-verses';

export interface StudyTabItem {
	id: StudyTab;
	label: string;
}

export const STUDY_TABS: StudyTabItem[] = [
	{ id: 'tafsir', label: 'Tafsirs' },
	{ id: 'layers', label: 'Layers' },
	{ id: 'lessons', label: 'Lessons' },
	{ id: 'reflections', label: 'Reflections' },
	{ id: 'answers', label: 'Answers' },
	{ id: 'qiraat', label: 'Qiraat' },
	{ id: 'hadith', label: 'Hadith' },
	{ id: 'related-verses', label: 'Related Verses' },
];
