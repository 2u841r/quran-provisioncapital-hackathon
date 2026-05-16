// Reusable helpers for detecting the current verse on screen and for
// scrolling highlighted rows into view inside a drawer/panel.

const NAVBAR_OFFSET = 80; // px below viewport top that still counts as "on screen"

export interface ActiveLocation {
	chapterId: number | null;
	verseNumber: number | null;
	pageNumber: number | null;
	juzNumber: number | null;
	hizbNumber: number | null;
}

const EMPTY: ActiveLocation = {
	chapterId: null,
	verseNumber: null,
	pageNumber: null,
	juzNumber: null,
	hizbNumber: null
};

/**
 * Find the first verse card still visible in the viewport.
 * Each VerseCard exposes `data-verse-key`, `data-page`, `data-chapter-id`, `data-hizb`.
 */
export function detectActiveLocation(): ActiveLocation {
	if (typeof document === 'undefined') return EMPTY;
	const cards = document.querySelectorAll<HTMLElement>('[data-verse-key]');
	for (const el of cards) {
		const rect = el.getBoundingClientRect();
		if (rect.bottom < NAVBAR_OFFSET) continue;
		const [c, v] = (el.dataset.verseKey ?? '').split(':');
		return {
			chapterId: Number(c) || null,
			verseNumber: Number(v) || null,
			pageNumber: Number(el.dataset.page ?? '') || null,
			juzNumber: Number(el.dataset.juz ?? '') || null,
			hizbNumber: Number(el.dataset.hizb ?? '') || null
		};
	}
	return EMPTY;
}

/**
 * Scroll every `[data-current="true"]` element inside `root` into view.
 * Called after a transition settles so the elements are mounted.
 */
export function scrollCurrentIntoView(
	root: string | HTMLElement = document.body,
	delayMs = 320
): void {
	if (typeof document === 'undefined') return;
	setTimeout(() => {
		const container =
			typeof root === 'string' ? document.querySelector(root) : root;
		if (!container) return;
		container
			.querySelectorAll('[data-current="true"]')
			.forEach((el) => (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'auto' }));
	}, delayMs);
}
