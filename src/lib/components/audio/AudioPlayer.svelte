<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState } from '$lib/state/reader.svelte';
	import { navbarState } from '$lib/state/navbar.svelte';
	import RepeatVerseModal from '$lib/components/reader/TranslationView/modals/RepeatVerseModal.svelte';

	const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

	function fmt(sec: number): string {
		if (!isFinite(sec) || sec < 0) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	function onSeek(e: Event) {
		audioState.seek(Number((e.target as HTMLInputElement).value));
	}

	const isLoading = $derived(audioState.status === 'loading');
	let repeatOpen = $state(false);

	$effect(() => {
		const key = audioState.currentVerseKey;
		if (!key || !readerState.autoScroll || !audioState.isPlaying) return;
		const el = document.querySelector(`[data-verse-key="${key}"]`);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});
	const seekPct = $derived(
		audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0
	);
</script>

{#if audioState.isActive}
	<div class="fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100 shadow-lg">

		{#if audioState.radioMode}
			<!-- Radio: single row -->
			<div class="flex h-14 items-center gap-2 px-4 md:h-12">
				<div class="min-w-0 flex-1">
					<p class="truncate text-xs font-semibold text-base-content leading-tight">{audioState.radioStationTitle}</p>
					{#if audioState.currentSurahName}
						<p class="truncate text-[0.65rem] text-base-content/60 leading-tight">
							{audioState.currentSurahName}{audioState.currentVerseKey ? ` · ${audioState.currentVerseKey}` : ''}
						</p>
					{:else if audioState.radioStationSubtitle}
						<p class="truncate text-[0.65rem] text-base-content/70 leading-tight">{audioState.radioStationSubtitle}</p>
					{/if}
				</div>
				<button class="btn btn-circle btn-primary btn-sm" onclick={() => audioState.togglePlay()} disabled={isLoading} aria-label={audioState.isPlaying ? 'Pause' : 'Play'}>
					{#if isLoading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if audioState.isPlaying}
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
					{/if}
				</button>
				<button class="btn btn-ghost btn-sm btn-circle text-base-content/60" onclick={() => audioState.stop()} aria-label="Close player">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
				</button>
			</div>

		{:else}
			<!-- Seek bar: full width -->
			<div class="px-3 pt-2">
				<div class="relative h-1.5 w-full rounded-full bg-base-300">
					<div class="absolute left-0 top-0 h-full rounded-full bg-primary transition-none" style="width: {seekPct}%"></div>
					<div class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow" style="left: {seekPct}%"></div>
					<input
						type="range"
						min="0"
						max={audioState.duration || 1}
						step="0.5"
						value={audioState.currentTime}
						oninput={onSeek}
						class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						aria-label="Seek"
					/>
				</div>
				<div class="flex justify-between px-0.5 pt-0.5">
					<span class="tabular-nums text-[0.65rem] text-base-content/50">{fmt(audioState.currentTime)}</span>
					<span class="tabular-nums text-[0.65rem] text-base-content/50">{fmt(audioState.duration)}</span>
				</div>
			</div>

			<!-- Controls row: centered -->
			<div class="flex items-center justify-center gap-2 px-3 pb-2 pt-1">
				<!-- Overflow -->
				<div class="dropdown dropdown-top">
					<button tabindex="0" class="btn btn-ghost btn-xs btn-circle text-base-content/70" aria-label="More">
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M13.25 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M2.75 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"/></svg>
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-1 shadow-lg border border-base-200 mb-2">
						<!-- Download -->
						<li>
							<a href={audioState.audioUrl || '#'} download target="_blank" rel="noreferrer" class={!audioState.audioUrl ? 'opacity-40 pointer-events-none' : ''}>
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 15 15"><path fill="currentColor" fill-rule="evenodd" d="M7.5 1.05a.45.45 0 0 1 .45.45v6.914l2.232-2.232a.45.45 0 1 1 .636.636l-3 3a.45.45 0 0 1-.636 0l-3-3a.45.45 0 1 1 .636-.636L7.05 8.414V1.5a.45.45 0 0 1 .45-.45M2.5 10a.5.5 0 0 1 .5.5V12c0 .554.446 1 .996 1h7.005A1 1 0 0 0 12 12v-1.5a.5.5 0 0 1 1 0V12c0 1.104-.894 2-1.999 2H3.996A1.997 1.997 0 0 1 2 12v-1.5a.5.5 0 0 1 .5-.5" clip-rule="evenodd"/></svg>
								Download
							</a>
						</li>
						<!-- Manage repeat -->
						<li>
							<button onclick={() => repeatOpen = true}>
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.65 5.813h11.625V9.3l4.65-4.65L18.275 0v3.488H4.325v6.975H6.65zm11.625 11.625H6.65V13.95L2 18.6l4.65 4.65v-3.488H20.6v-6.975h-2.325z"/></svg>
								Manage repeat settings
							</button>
						</li>
						<li><hr class="my-0.5 border-base-200" /></li>
						<!-- Experience -->
						<li>
							<details>
								<summary>
									<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="m68.5 6.5.3 29.7L69 66h20c11 0 20 .3 20 .6s-13.4 22.9-29.7 50.2l-29.8 49.6-.3-29.7L49 107H8.1l30.2-50.3z" transform="scale(.13)"/></svg>
									Experience
								</summary>
								<ul class="!p-2 space-y-2">
									<li class="!p-0">
										<label class="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-base-200 rounded-lg">
											<input type="checkbox" class="checkbox checkbox-primary checkbox-xs" checked={readerState.autoScroll} onchange={() => readerState.toggleAutoScroll()} />
											<span class="text-xs">Auto-scroll</span>
										</label>
									</li>
									<li class="!p-0">
										<label class="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-base-200 rounded-lg" class:opacity-50={!readerState.wordByWord}>
											<input type="checkbox" class="checkbox checkbox-primary checkbox-xs" checked={readerState.showTooltipWhenPlaying} onchange={() => readerState.toggleShowTooltipWhenPlaying()} disabled={!readerState.wordByWord} />
											<span class="text-xs">Show tooltip when playing</span>
										</label>
										{#if !readerState.wordByWord}
											<p class="text-[0.6rem] text-base-content/60 px-1 mt-0.5 leading-snug">Tick the tooltip display option and select Translation and/or Transliteration under Settings &gt; Word By Word to enable this feature.</p>
										{/if}
									</li>
								</ul>
							</details>
						</li>
						<!-- Speed -->
						<li>
							<details>
								<summary>
									<span class="text-xs font-bold">{audioState.playbackRate}x</span>
									Speed
								</summary>
								<ul>
									{#each SPEEDS as s (s)}
										<li><button class={audioState.playbackRate === s ? 'active' : ''} onclick={() => audioState.setPlaybackRate(s)}>{s}x</button></li>
									{/each}
								</ul>
							</details>
						</li>
						<!-- Reciter -->
						<li>
							<button onclick={() => navbarState.reciterDrawerOpen = true}>
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 20 20"><path fill="currentColor" fill-rule="evenodd" stroke="currentColor" d="M10 1.166a4.833 4.833 0 0 0-1.342 9.478c-1.593.194-2.958.757-3.987 1.77C3.362 13.706 2.7 15.627 2.7 18.134a.633.633 0 1 0 1.267 0c0-2.294.604-3.84 1.594-4.816.993-.978 2.475-1.484 4.44-1.484 1.963 0 3.445.506 4.438 1.484.99.976 1.594 2.522 1.594 4.816a.633.633 0 1 0 1.267 0c0-2.507-.663-4.428-1.972-5.718-1.029-1.014-2.394-1.577-3.986-1.771a4.835 4.835 0 0 0-1.342-9.478ZM6.432 5.999a3.567 3.567 0 1 1 7.133 0 3.567 3.567 0 0 1-7.133 0Z" clip-rule="evenodd"/></svg>
								Reciter
							</button>
						</li>
					</ul>
				</div>

				<!-- Volume -->
				<div class="dropdown dropdown-top">
					<button tabindex="0" class="btn btn-ghost btn-xs btn-circle text-base-content/70" aria-label="Volume">
						{#if audioState.volume === 0}
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
						{/if}
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div tabindex="0" class="dropdown-content z-[1] bg-base-100 rounded-box p-3 shadow border border-base-200 mb-2 w-40">
						<input type="range" min="0" max="1" step="0.05" value={audioState.volume} oninput={(e) => audioState.setVolume(Number((e.target as HTMLInputElement).value))} class="range range-primary range-xs" aria-label="Volume" />
					</div>
				</div>

				<!-- Prev -->
				<button class="btn btn-ghost btn-xs btn-circle text-base-content/70" onclick={() => audioState.prevVerse()} disabled={isLoading || audioState.currentVerseNumber <= 1} aria-label="Previous verse">
					<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
				</button>

				<!-- Play / Pause -->
				<button class="btn btn-circle btn-primary btn-sm" onclick={() => audioState.togglePlay()} disabled={isLoading} aria-label={audioState.isPlaying ? 'Pause' : 'Play'}>
					{#if isLoading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if audioState.isPlaying}
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
					{/if}
				</button>

				<!-- Next -->
				<button class="btn btn-ghost btn-xs btn-circle text-base-content/70" onclick={() => audioState.nextVerse()} disabled={isLoading || audioState.currentVerseNumber >= audioState.totalVerses} aria-label="Next verse">
					<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12h2v12h-2z"/></svg>
				</button>

				<!-- Close -->
				<button class="btn btn-ghost btn-xs btn-circle text-base-content/60" onclick={() => audioState.stop()} aria-label="Close player">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
				</button>
			</div>
		{/if}

	</div>
{/if}

{#if repeatOpen && audioState.currentVerseKey}
	<RepeatVerseModal
		verse={{ verseNumber: audioState.currentVerseNumber, verseKey: audioState.currentVerseKey, chapterId: audioState.loadedChapterId ?? undefined }}
		chapterName={audioState.chapterName}
		chapterId={audioState.loadedChapterId ?? undefined}
		open={repeatOpen}
		onClose={() => (repeatOpen = false)}
	/>
{/if}
