import type { Reciter } from '$lib/types/quran';

export type AudioTrack = {
	reciterId: number;
	chapterId: number;
};

export type CuratedStation = {
	id: string;
	title: string;
	description: string;
	imageSrc: string;
	tracks: AudioTrack[];
};

export type ActiveStation =
	| { type: 'curated'; id: string }
	| { type: 'reciter'; id: number }
	| null;

export type RadioReciter = Reciter & {
	profilePicture?: string;
	style?: string | { name?: string };
};
