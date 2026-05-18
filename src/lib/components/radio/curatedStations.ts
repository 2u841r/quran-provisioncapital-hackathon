import type { AudioTrack, CuratedStation } from './types';

const CHAPTERS_COUNT = 114;
const JUZ_AMMA_FIRST_CHAPTER = 78;
const POPULAR_RECITER_IDS = [7, 3, 10, 4];

function range(from: number, to: number) {
	return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function tracksForChapters(chapterIds: number[]): AudioTrack[] {
	return POPULAR_RECITER_IDS.flatMap((reciterId) =>
		chapterIds.map((chapterId) => ({ reciterId, chapterId }))
	);
}

export const curatedStations: CuratedStation[] = [
	{
		id: '1',
		title: 'Popular Recitations',
		description: 'Daily curated feed of recitations',
		imageSrc: '/images/stations/1.jpeg',
		tracks: tracksForChapters(range(1, CHAPTERS_COUNT))
	},
	{
		id: '2',
		title: 'Yaseen, Al-Waqiah, Al-Mulk',
		description: 'The Surahs from a curation of reciters',
		imageSrc: '/images/stations/2.jpg',
		tracks: [
			{ reciterId: 7, chapterId: 36 },
			{ reciterId: 7, chapterId: 56 },
			{ reciterId: 7, chapterId: 67 }
		]
	},
	{
		id: '3',
		title: 'Surah Al-Kahf',
		description: 'Listen to Surah Al-Kahf on repeat',
		imageSrc: '/images/stations/3.jpeg',
		tracks: tracksForChapters([18])
	},
	{
		id: '4',
		title: 'Juz Amma',
		description: 'Listen to the final Juz of the Quran',
		imageSrc: '/images/stations/4.jpeg',
		tracks: tracksForChapters(range(JUZ_AMMA_FIRST_CHAPTER, CHAPTERS_COUNT))
	}
];

export function sampleTrack(tracks: AudioTrack[]): AudioTrack {
	return tracks[Math.floor(Math.random() * tracks.length)] ?? tracks[0];
}

export function getRandomStation(): CuratedStation {
	return curatedStations[Math.floor(Math.random() * curatedStations.length)] ?? curatedStations[0];
}
