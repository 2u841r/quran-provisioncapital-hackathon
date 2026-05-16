<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
	import { navbarState } from '$lib/state/navbar.svelte';
	import { getChaptersData } from '$lib/api/quran';
	import type { Chapter, Verse } from '$lib/types/quran';

	interface Props {
		chapter: Chapter;
		firstVerse?: Verse | null;
		onOpenSettings: () => void;
	}

	const { chapter, firstVerse = null, onOpenSettings }: Props = $props();

	const chaptersData = getChaptersData();
	const chapterList = $derived(
		Object.values(chaptersData).sort((a, b) => (a.id as number) - (b.id as number))
	);

	let surahOpen = $state(false);

	const isReading = $derived(readerState.readingMode === 'reading');
	const readingSub = $derived(readerState.readingSubMode);

	function selectReadingSubMode(sub: 'arabic' | 'translation') {
		readerState.setReadingMode('reading');
		readerState.setReadingSubMode(sub);
	}
</script>

<div class="sticky z-20 bg-base-100 border-b border-base-200 shadow-sm transition-[top] duration-300 {navbarState.visible ? 'top-16' : 'top-0'}">
	<div class="px-6">

		<!-- ── Desktop: 3 columns ────────────────────────────────────── -->
		<div class="hidden md:grid grid-cols-3 items-center h-11 gap-2">

			<!-- Left: Surah navigator -->
			<div class="relative flex items-center">
				<button
					class="flex items-center gap-1 font-semibold text-sm text-base-content hover:text-primary transition-colors"
					onclick={() => (surahOpen = !surahOpen)}
					aria-expanded={surahOpen}
				>
					<span>{chapter.id}. {chapter.nameSimple}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15"
						class="transition-transform shrink-0 {surahOpen ? 'rotate-180' : ''}"
					>
						<path fill="currentColor" fill-rule="evenodd" d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707" clip-rule="evenodd"/>
					</svg>
				</button>

				{#if surahOpen}
					<button class="fixed inset-0 z-30" onclick={() => (surahOpen = false)} aria-label="Close" tabindex="-1"></button>
					<div class="absolute left-0 top-full mt-1 w-64 bg-base-100 border border-base-200 rounded-lg shadow-xl z-40 overflow-y-auto max-h-80">
						{#each chapterList as ch (ch.id)}
							<a
								href="/{ch.id}"
								class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-sm {ch.id === chapter.id ? 'bg-primary/10 text-primary font-medium' : 'text-base-content'}"
								onclick={() => (surahOpen = false)}
							>
								<span class="text-xs text-base-content/40 w-6 text-right shrink-0">{ch.id}</span>
								<span class="flex-1">{ch.nameSimple}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Center: Page / Juz / Hizb -->
			<div class="flex justify-center">
				{#if firstVerse?.pageNumber}
					<div class="text-center">
						<div class="text-xs font-medium text-base-content/70">Page {firstVerse.pageNumber}</div>
						{#if firstVerse.juzNumber}
							<div class="text-[0.6rem] text-base-content/40">
								Juz {firstVerse.juzNumber}{firstVerse.hizbNumber ? ` / Hizb ${firstVerse.hizbNumber}` : ''}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Right: Reading mode toggle + settings -->
			<div class="flex items-center justify-end gap-2">
				<div class="flex items-center gap-1 bg-base-200 rounded-full p-0.5 text-xs font-medium">
					<!-- Verse by Verse -->
					<button
						class="flex items-center gap-1 px-3 py-1 rounded-full transition-all whitespace-nowrap shrink-0 {!isReading ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/50 hover:text-base-content'}"
						onclick={() => readerState.setReadingMode('translation')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" fill="none" viewBox="0 0 12 15">
							<rect width="11" height="14" x="0.5" y="0.5" stroke="currentColor" rx="1.5"/>
							<path fill="currentColor" d="M2.75 3.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M2.75 6.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M2.75 10a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M5 3.5A.75.75 0 0 0 5 5h4.25a.75.75 0 0 0 0-1.5zM5 6.75a.75.75 0 0 0 0 1.5h4.25a.75.75 0 0 0 0-1.5zM5 10a.75.75 0 0 0 0 1.5h4.25a.75.75 0 0 0 0-1.5z"/>
						</svg>
						Verse by Verse
					</button>

					<!-- Reading pill -->
					{#if isReading}
						<div class="flex items-center bg-base-100 rounded-full shadow-sm overflow-hidden">
							<button
								role="tab"
								aria-selected={readingSub === 'arabic'}
								class="flex items-center gap-1 px-2 py-1 transition-colors {readingSub === 'arabic' ? 'text-primary' : 'text-base-content/50 hover:text-base-content'}"
								onclick={() => selectReadingSubMode('arabic')}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" fill="none" viewBox="0 0 12 16">
									<rect width="11" height="14" x="0.497" y="0.511" stroke="currentColor" rx="1.5"/>
									<path fill="currentColor" d="M5.854 3.01c-1.097 0-2 .89-2 1.97 0 .523.217 1 .572 1.355a3.08 3.08 0 0 0-1.429 2.582c0 1.704 1.412 3.094 3.143 3.094 1.006 0 2-.259 2.857-.754l-.571-.973a4.65 4.65 0 0 1-2.286.602c-1.109 0-2-.872-2-1.969a1.94 1.94 0 0 1 .411-1.199 2 2 0 0 1 1.069-.702l2.977-.788L8.3 5.143l-2.543.68a.856.856 0 0 1-.76-.844c0-.472.377-.843.857-.843a.9.9 0 0 1 .429.112l.571-.973a2 2 0 0 0-1-.264"/>
								</svg>
								Arabic
							</button>
							<div class="w-px h-4 bg-base-200" aria-hidden="true"></div>
							<button
								role="tab"
								aria-selected={readingSub === 'translation'}
								class="flex items-center gap-1 px-2 py-1 transition-colors {readingSub === 'translation' ? 'text-primary' : 'text-base-content/50 hover:text-base-content'}"
								onclick={() => selectReadingSubMode('translation')}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="11" height="13" fill="none" viewBox="0 0 13 16">
									<rect width="11" height="14" x="1.489" y="0.513" stroke="currentColor" rx="1.5"/>
									<path fill="currentColor" d="m3.1 12.012 3.298-8.575h1.268l3.31 8.575H9.845l-.726-1.903h-4.16l-.726 1.903zm2.153-2.854H8.81l-1.772-4.77z"/>
								</svg>
								Translation
							</button>
						</div>
					{:else}
						<button
							class="flex items-center gap-1 px-2 py-1 rounded-full text-base-content/50 hover:text-base-content transition-colors"
							onclick={() => selectReadingSubMode('arabic')}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" fill="none" viewBox="0 0 12 16">
								<rect width="11" height="14" x="0.497" y="0.511" stroke="currentColor" rx="1.5"/>
								<path fill="currentColor" d="M5.854 3.01c-1.097 0-2 .89-2 1.97 0 .523.217 1 .572 1.355a3.08 3.08 0 0 0-1.429 2.582c0 1.704 1.412 3.094 3.143 3.094 1.006 0 2-.259 2.857-.754l-.571-.973a4.65 4.65 0 0 1-2.286.602c-1.109 0-2-.872-2-1.969a1.94 1.94 0 0 1 .411-1.199 2 2 0 0 1 1.069-.702l2.977-.788L8.3 5.143l-2.543.68a.856.856 0 0 1-.76-.844c0-.472.377-.843.857-.843a.9.9 0 0 1 .429.112l.571-.973a2 2 0 0 0-1-.264"/>
							</svg>
							Reading
						</button>
					{/if}
				</div>

				<button class="btn btn-ghost btn-sm btn-circle" onclick={onOpenSettings} aria-label="Change Settings">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12.32 7.582a4.044 4.044 0 1 0 4.044 4.043 4.056 4.056 0 0 0-4.043-4.043m8.73 4.043q-.003.567-.082 1.13l2.46 1.926a.586.586 0 0 1 .134.747l-2.328 4.02a.59.59 0 0 1-.715.248l-2.894-1.162a9 9 0 0 1-1.962 1.146l-.433 3.072a.6.6 0 0 1-.581.498H9.993a.61.61 0 0 1-.582-.482l-.433-3.072a8.6 8.6 0 0 1-1.962-1.147l-2.893 1.163a.59.59 0 0 1-.715-.249L1.08 15.445a.586.586 0 0 1 .133-.748l2.46-1.926a9 9 0 0 1-.082-1.146q.003-.567.083-1.13L1.213 8.57a.586.586 0 0 1-.133-.747l2.328-4.02a.59.59 0 0 1 .715-.248l2.893 1.162A9 9 0 0 1 8.978 3.57L9.411.498A.6.6 0 0 1 9.993 0h4.656a.61.61 0 0 1 .582.482l.432 3.072A8.6 8.6 0 0 1 17.628 4.7l2.89-1.163a.59.59 0 0 1 .716.249l2.328 4.019a.586.586 0 0 1-.133.747l-2.461 1.927q.078.57.083 1.145"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- ── Mobile/Tablet: Row 1 — Surah + Settings ───────────────── -->
		<div class="flex md:hidden items-center justify-between h-11">
			<div class="relative">
				<button
					class="flex items-center gap-1 font-semibold text-sm text-base-content hover:text-primary transition-colors"
					onclick={() => (surahOpen = !surahOpen)}
					aria-expanded={surahOpen}
				>
					<span>{chapter.id}. {chapter.nameSimple}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15"
						class="transition-transform shrink-0 {surahOpen ? 'rotate-180' : ''}"
					>
						<path fill="currentColor" fill-rule="evenodd" d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707" clip-rule="evenodd"/>
					</svg>
				</button>

				{#if surahOpen}
					<button class="fixed inset-0 z-30" onclick={() => (surahOpen = false)} aria-label="Close" tabindex="-1"></button>
					<div class="absolute left-0 top-full mt-1 w-64 bg-base-100 border border-base-200 rounded-lg shadow-xl z-40 overflow-y-auto max-h-72">
						{#each chapterList as ch (ch.id)}
							<a
								href="/{ch.id}"
								class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-sm {ch.id === chapter.id ? 'bg-primary/10 text-primary font-medium' : 'text-base-content'}"
								onclick={() => (surahOpen = false)}
							>
								<span class="text-xs text-base-content/40 w-6 text-right shrink-0">{ch.id}</span>
								<span class="flex-1">{ch.nameSimple}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<button class="btn btn-ghost btn-sm btn-circle" onclick={onOpenSettings} aria-label="Change Settings">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12.32 7.582a4.044 4.044 0 1 0 4.044 4.043 4.056 4.056 0 0 0-4.043-4.043m8.73 4.043q-.003.567-.082 1.13l2.46 1.926a.586.586 0 0 1 .134.747l-2.328 4.02a.59.59 0 0 1-.715.248l-2.894-1.162a9 9 0 0 1-1.962 1.146l-.433 3.072a.6.6 0 0 1-.581.498H9.993a.61.61 0 0 1-.582-.482l-.433-3.072a8.6 8.6 0 0 1-1.962-1.147l-2.893 1.163a.59.59 0 0 1-.715-.249L1.08 15.445a.586.586 0 0 1 .133-.748l2.46-1.926a9 9 0 0 1-.082-1.146q.003-.567.083-1.13L1.213 8.57a.586.586 0 0 1-.133-.747l2.328-4.02a.59.59 0 0 1 .715-.248l2.893 1.162A9 9 0 0 1 8.978 3.57L9.411.498A.6.6 0 0 1 9.993 0h4.656a.61.61 0 0 1 .582.482l.432 3.072A8.6 8.6 0 0 1 17.628 4.7l2.89-1.163a.59.59 0 0 1 .716.249l2.328 4.019a.586.586 0 0 1-.133.747l-2.461 1.927q.078.57.083 1.145"/>
				</svg>
			</button>
		</div>

		<!-- ── Mobile/Tablet: Row 2 — Reading mode tabs ──────────────── -->
		<div class="flex md:hidden border-t border-base-200" role="tablist" aria-label="Reading mode">
			<button
				role="tab"
				aria-selected={!isReading}
				class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap {!isReading ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content'}"
				onclick={() => readerState.setReadingMode('translation')}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="11" height="13" fill="none" viewBox="0 0 12 15">
					<rect width="11" height="14" x="0.5" y="0.5" stroke="currentColor" rx="1.5"/>
					<path fill="currentColor" d="M2.75 3.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M2.75 6.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M2.75 10a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M5 3.5A.75.75 0 0 0 5 5h4.25a.75.75 0 0 0 0-1.5zM5 6.75a.75.75 0 0 0 0 1.5h4.25a.75.75 0 0 0 0-1.5zM5 10a.75.75 0 0 0 0 1.5h4.25a.75.75 0 0 0 0-1.5z"/>
				</svg>
				Verse by Verse
			</button>
			<button
				role="tab"
				aria-selected={isReading}
				class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 {isReading ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content'}"
				onclick={() => selectReadingSubMode('arabic')}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="11" height="13" fill="none" viewBox="0 0 12 15">
					<rect width="11" height="14" x="0.5" y="0.5" stroke="currentColor" rx="1.5"/>
					<path fill="currentColor" d="M10 4.26c0-.442-.3-.76-.67-.76H2.67c-.37 0-.67.318-.67.76 0 .443.3.8.67.8h6.66c.37 0 .67-.357.67-.8m0 3.214c0-.442-.3-.76-.67-.76H2.67c-.37 0-.67.318-.67.76 0 .443.3.8.67.8h6.66c.37 0 .67-.357.67-.8m0 3.225c0-.442-.3-.759-.67-.759H2.67c-.37 0-.67.317-.67.76 0 .442.3.8.67.8h6.66c.37 0 .67-.358.67-.8"/>
				</svg>
				Reading
			</button>
		</div>

	</div>
</div>
