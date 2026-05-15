export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused';

function createAudioState() {
	let status = $state<AudioStatus>('idle');
	let currentVerseKey = $state<string | null>(null);
	let currentChapterId = $state<number | null>(null);
	let reciterId = $state(7); // Mishary default
	let duration = $state(0);
	let currentTime = $state(0);
	let audio: HTMLAudioElement | null = null;

	function cleanup() {
		if (audio) {
			audio.pause();
			audio.src = '';
			audio.onended = null;
			audio.ontimeupdate = null;
			audio.onloadedmetadata = null;
			audio = null;
		}
	}

	function buildUrl(verseKey: string, recId: number): string {
		// quran.com CDN format: https://verses.quran.com/{reciter_id}/{chapter}/{verse}.mp3
		const [chapter, verse] = verseKey.split(':');
		const c = chapter.padStart(3, '0');
		const v = verse.padStart(3, '0');
		return `https://verses.quran.com/${recId}/${c}${v}.mp3`;
	}

	async function play(verseKey: string) {
		if (typeof window === 'undefined') return;

		// Same verse toggle
		if (currentVerseKey === verseKey && audio) {
			if (status === 'playing') {
				audio.pause();
				status = 'paused';
			} else {
				await audio.play();
				status = 'playing';
			}
			return;
		}

		cleanup();
		status = 'loading';
		currentVerseKey = verseKey;
		currentChapterId = Number(verseKey.split(':')[0]);

		const el = new Audio(buildUrl(verseKey, reciterId));
		audio = el;

		el.onloadedmetadata = () => { duration = el.duration; };
		el.ontimeupdate = () => { currentTime = el.currentTime; };
		el.onended = () => {
			status = 'idle';
			currentTime = 0;
		};
		el.onerror = () => { status = 'idle'; };

		try {
			await el.play();
			status = 'playing';
		} catch {
			status = 'idle';
		}
	}

	function pause() {
		if (audio && status === 'playing') {
			audio.pause();
			status = 'paused';
		}
	}

	function stop() {
		cleanup();
		status = 'idle';
		currentVerseKey = null;
		currentTime = 0;
		duration = 0;
	}

	function seek(time: number) {
		if (audio) {
			audio.currentTime = time;
			currentTime = time;
		}
	}

	function setReciter(id: number) {
		reciterId = id;
		stop();
	}

	return {
		get status() { return status; },
		get currentVerseKey() { return currentVerseKey; },
		get currentChapterId() { return currentChapterId; },
		get reciterId() { return reciterId; },
		get duration() { return duration; },
		get currentTime() { return currentTime; },
		get isPlaying() { return status === 'playing'; },
		play,
		pause,
		stop,
		seek,
		setReciter
	};
}

export const audioState = createAudioState();
