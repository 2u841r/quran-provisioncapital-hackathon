import { getContentToken, fetchVerseText } from './qf-content';
import { getSurahsInRange, SURAH_NAMES, SURAH_VERSE_COUNTS, JUZ_SURAHS } from '$lib/games/data';

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function randomPick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomVerseKey(surah: number): string {
	const verse = Math.floor(Math.random() * SURAH_VERSE_COUNTS[surah]) + 1;
	return `${surah}:${verse}`;
}

function getPrevKey(key: string): string | null {
	const [s, v] = key.split(':').map(Number);
	if (v > 1) return `${s}:${v - 1}`;
	if (s > 1) return `${s - 1}:${SURAH_VERSE_COUNTS[s - 1]}`;
	return null;
}

function getNextKey(key: string): string | null {
	const [s, v] = key.split(':').map(Number);
	if (v < SURAH_VERSE_COUNTS[s]) return `${s}:${v + 1}`;
	if (s < 114) return `${s + 1}:1`;
	return null;
}

export type WhichSurahQuestion = {
	verse_key: string;
	text: string;
	options: { id: number; name: string }[];
	correct_id: number;
};

export async function generateWhichSurahQuestions(
	juzStart: number,
	juzEnd: number
): Promise<WhichSurahQuestion[]> {
	const token = await getContentToken();
	let surahs = getSurahsInRange(juzStart, juzEnd);

	// Need at least 4 distinct surahs for options
	let optionPool = [...surahs];
	if (optionPool.length < 4) {
		const extra = juzStart > 1
			? JUZ_SURAHS[juzStart - 1] ?? []
			: JUZ_SURAHS[juzEnd + 1] ?? [];
		optionPool = [...new Set([...optionPool, ...extra])];
	}
	if (optionPool.length < 4) {
		// fallback: fill from neighbors
		for (let j = 1; j <= 30 && optionPool.length < 4; j++) {
			optionPool = [...new Set([...optionPool, ...(JUZ_SURAHS[j] ?? [])])];
		}
	}

	// Pick 10 question surahs (allow repeats if pool small)
	const shuffled = shuffle(surahs);
	const questionSurahs: number[] = [];
	for (let i = 0; i < 10; i++) questionSurahs.push(shuffled[i % shuffled.length]);

	const verseKeys = questionSurahs.map(randomVerseKey);
	const texts = await Promise.all(verseKeys.map(k => fetchVerseText(k, token)));

	return texts.map((text, i) => {
		const correctId = questionSurahs[i];
		const wrongs = shuffle(optionPool.filter(s => s !== correctId)).slice(0, 3);
		const options = shuffle([
			{ id: correctId, name: SURAH_NAMES[correctId].en },
			...wrongs.map(s => ({ id: s, name: SURAH_NAMES[s].en }))
		]);
		return { verse_key: verseKeys[i], text, options, correct_id: correctId };
	});
}

export type PrevNextQuestion = {
	verse_key: string;
	text: string;
	mode: 'prev' | 'next';
	options: { verse_key: string; text: string }[];
	correct_key: string;
};

export async function generatePrevNextQuestions(
	juzStart: number,
	juzEnd: number,
	mode: 'prev' | 'next'
): Promise<PrevNextQuestion[]> {
	const token = await getContentToken();
	const surahs = getSurahsInRange(juzStart, juzEnd);

	const pairs: { qKey: string; answerKey: string }[] = [];
	let attempts = 0;
	while (pairs.length < 10 && attempts < 200) {
		attempts++;
		const qKey = randomVerseKey(randomPick(surahs));
		const answerKey = mode === 'prev' ? getPrevKey(qKey) : getNextKey(qKey);
		if (answerKey) pairs.push({ qKey, answerKey });
	}

	// Collect unique keys to fetch
	const allKeys = [...new Set([...pairs.map(p => p.qKey), ...pairs.map(p => p.answerKey)])];
	const textMap = new Map<string, string>();
	await Promise.all(allKeys.map(async k => {
		textMap.set(k, await fetchVerseText(k, token));
	}));

	return pairs.map((pair, i) => {
		const wrongPool = pairs
			.filter((_, j) => j !== i)
			.map(p => p.qKey)
			.filter(k => k !== pair.answerKey && k !== pair.qKey);
		const wrongKeys = shuffle(wrongPool).slice(0, 3);
		const options = shuffle([
			{ verse_key: pair.answerKey, text: textMap.get(pair.answerKey) ?? '' },
			...wrongKeys.map(k => ({ verse_key: k, text: textMap.get(k) ?? '' }))
		]);
		return {
			verse_key: pair.qKey,
			text: textMap.get(pair.qKey) ?? '',
			mode,
			options,
			correct_key: pair.answerKey
		};
	});
}
