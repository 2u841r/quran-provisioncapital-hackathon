export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused';

export interface VerseTiming {
	verseKey: string;
	timestampFrom: number; // ms
	timestampTo: number;   // ms
	duration: number;      // ms
	segments?: [number, number, number][]; // [wordPos, from, to]
}

interface ChapterAudioFile {
	audioUrl: string;
	duration: number; // ms
	verseTimings: VerseTiming[];
}

const QDC_BASE = 'https://api.qurancdn.com/api/qdc';

async function fetchChapterAudio(reciterId: number, chapterId: number): Promise<ChapterAudioFile> {
	const url = `${QDC_BASE}/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=true`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Audio API ${res.status}`);
	const json = await res.json() as { audio_files?: Record<string, unknown>[] };
	const file = json.audio_files?.[0];
	if (!file) throw new Error('No audio file');
	return {
		audioUrl: file.audio_url as string,
		duration: file.duration as number,
		verseTimings: ((file.verse_timings ?? []) as Record<string, unknown>[]).map((vt) => ({
			verseKey: vt.verse_key as string,
			timestampFrom: vt.timestamp_from as number,
			timestampTo: vt.timestamp_to as number,
			duration: vt.duration as number,
			segments: vt.segments as [number, number, number][] | undefined
		}))
	};
}

function createAudioState() {
	let status = $state<AudioStatus>('idle');
	let reciterId = $state(7);
	let loadedChapterId = $state<number | null>(null);
	let loadedReciterId = $state<number | null>(null);
	let verseTimings = $state<VerseTiming[]>([]);
	let currentTime = $state(0); // seconds
	let duration = $state(0);    // seconds
	let chapterName = $state('');
	let totalVerses = $state(0);
	let audio: HTMLAudioElement | null = null;
	let volume = $state(1);
	let playbackRate = $state(1);
	let audioUrl = $state('');

	const currentVerseIdx = $derived(() => {
		if (!verseTimings.length) return 0;
		const ms = currentTime * 1000;
		const idx = verseTimings.findLastIndex((vt) => ms >= vt.timestampFrom);
		return idx >= 0 ? idx : 0;
	});

	const currentVerseNumber = $derived(currentVerseIdx() + 1);

	const currentVerseKey = $derived(
		verseTimings.length && loadedChapterId
			? `${loadedChapterId}:${currentVerseNumber}`
			: null
	);

	function cleanup() {
		if (audio) {
			audio.pause();
			audio.src = '';
			audio.ontimeupdate = null;
			audio.onloadedmetadata = null;
			audio.onended = null;
			audio.onerror = null;
			audio = null;
		}
	}

	function seekToVerse(verseNum: number) {
		if (!audio || !verseTimings.length) return;
		const vt = verseTimings[verseNum - 1];
		if (!vt) return;
		audio.currentTime = vt.timestampFrom / 1000;
	}

	async function loadChapter(chapterId: number, startVerseNum = 1, name = '') {
		if (typeof window === 'undefined') return;
		status = 'loading';
		chapterName = name;
		try {
			const data = await fetchChapterAudio(reciterId, chapterId);
			cleanup();
			const el = new Audio(data.audioUrl);
			el.volume = volume;
			el.playbackRate = playbackRate;
			audio = el;
			audioUrl = data.audioUrl;
			verseTimings = data.verseTimings;
			totalVerses = data.verseTimings.length;
			loadedChapterId = chapterId;
			loadedReciterId = reciterId;

			el.onloadedmetadata = () => {
				duration = el.duration;
				seekToVerse(startVerseNum);
				el.play().then(() => { status = 'playing'; }).catch(() => { status = 'idle'; });
			};
			el.ontimeupdate = () => { currentTime = el.currentTime; };
			el.onended = () => { status = 'paused'; };
			el.onerror = () => { status = 'idle'; };
			el.load();
		} catch {
			status = 'idle';
		}
	}

	async function playVerse(verseKey: string, name = '') {
		if (typeof window === 'undefined') return;
		const [chIdStr, vNumStr] = verseKey.split(':');
		const chId = Number(chIdStr);
		const vNum = Number(vNumStr);

		if (loadedChapterId === chId && loadedReciterId === reciterId && audio) {
			seekToVerse(vNum);
			if (status !== 'playing') {
				await audio.play().catch(() => {});
				status = 'playing';
			}
		} else {
			await loadChapter(chId, vNum, name);
		}
	}

	function togglePlay() {
		if (!audio) return;
		if (status === 'playing') {
			audio.pause();
			status = 'paused';
		} else if (status === 'paused') {
			audio.play().then(() => { status = 'playing'; }).catch(() => {});
		}
	}

	function nextVerse() {
		const next = currentVerseNumber + 1;
		if (next <= totalVerses) seekToVerse(next);
	}

	function prevVerse() {
		const ms = currentTime * 1000;
		const vt = verseTimings[currentVerseIdx()];
		if (vt && ms - vt.timestampFrom > 2000) {
			seekToVerse(currentVerseNumber);
		} else {
			const prev = currentVerseNumber - 1;
			if (prev >= 1) seekToVerse(prev);
		}
	}

	function seek(seconds: number) {
		if (audio) { audio.currentTime = seconds; currentTime = seconds; }
	}

	function stop() {
		cleanup();
		status = 'idle';
		currentTime = 0;
		duration = 0;
		loadedChapterId = null;
		loadedReciterId = null;
		verseTimings = [];
		totalVerses = 0;
		chapterName = '';
	}

	function setReciter(id: number) {
		reciterId = id;
		stop();
	}

	function setVolume(v: number) {
		const clamped = Math.max(0, Math.min(1, v));
		volume = clamped;
		if (audio) audio.volume = clamped;
	}

	function setPlaybackRate(r: number) {
		playbackRate = r;
		if (audio) audio.playbackRate = r;
	}

	return {
		get status() { return status; },
		get reciterId() { return reciterId; },
		get loadedChapterId() { return loadedChapterId; },
		get verseTimings() { return verseTimings; },
		get currentTime() { return currentTime; },
		get duration() { return duration; },
		get chapterName() { return chapterName; },
		get totalVerses() { return totalVerses; },
		get isPlaying() { return status === 'playing'; },
		get isActive() { return status !== 'idle'; },
		get currentVerseNumber() { return currentVerseNumber; },
		get currentVerseKey() { return currentVerseKey; },
		get volume() { return volume; },
		get playbackRate() { return playbackRate; },
		get audioUrl() { return audioUrl; },
		playVerse,
		togglePlay,
		nextVerse,
		prevVerse,
		seek,
		stop,
		setReciter,
		setVolume,
		setPlaybackRate
	};
}

export const audioState = createAudioState();
