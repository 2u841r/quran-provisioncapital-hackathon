export type StudyTab = 'tafsir' | 'lessons' | 'reflections' | 'answers' | 'hadith';

export interface StudyTabItem {
	id: StudyTab;
	label: string;
}

export const STUDY_TABS: StudyTabItem[] = [
	{ id: 'tafsir', label: 'Tafsirs' },
	{ id: 'lessons', label: 'Lessons' },
	{ id: 'reflections', label: 'Reflections' },
	{ id: 'answers', label: 'Answers' },
	{ id: 'hadith', label: 'Hadith' }
];
