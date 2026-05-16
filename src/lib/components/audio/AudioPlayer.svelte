<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';
	import { readerState } from '$lib/state/reader.svelte';

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
</script>

{#if audioState.isActive}
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 shadow-lg">
		<div class="max-w-3xl mx-auto px-4 py-3">
			<!-- Title row -->
			<div class="flex items-center justify-center gap-2 mb-2">
				<span class="text-xs font-semibold text-base-content truncate">
					{audioState.chapterName || `Chapter ${audioState.loadedChapterId}`}
				</span>
				<span class="text-[0.65rem] text-base-content/50">
					{#if isLoading}
						Loading…
					{:else}
						· Verse {audioState.currentVerseNumber} / {audioState.totalVerses}
					{/if}
				</span>
			</div>

			<!-- Seek slider -->
			<div class="flex items-center gap-2 mb-2">
				<span class="text-[0.65rem] text-base-content/40 w-9 text-right shrink-0 tabular-nums">{fmt(audioState.currentTime)}</span>
				<input
					type="range"
					min="0"
					max={audioState.duration || 1}
					step="0.5"
					value={audioState.currentTime}
					oninput={onSeek}
					class="range range-primary range-xs flex-1"
					aria-label="Seek"
				/>
				<span class="text-[0.65rem] text-base-content/40 w-9 shrink-0 tabular-nums">{fmt(audioState.duration)}</span>
			</div>

			<!-- Controls row (centered) -->
			<div class="flex items-center justify-center gap-3 md:gap-5">
				<!-- Overflow menu -->
				<div class="dropdown dropdown-top">
					<button tabindex="0" class="btn btn-ghost btn-sm btn-circle text-base-content/70" aria-label="More">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M13.25 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M2.75 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"/></svg>
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow border border-base-200 mb-2 max-h-[60vh] overflow-y-auto">
						<li class="menu-title text-[0.6rem] uppercase tracking-wide">Experience</li>
						<li>
							<button
								class={readerState.readingMode === 'translation' ? 'active' : ''}
								onclick={() => readerState.setReadingMode('translation')}
							>Translation</button>
						</li>
						<li>
							<button
								class={readerState.readingMode === 'reading' ? 'active' : ''}
								onclick={() => readerState.setReadingMode('reading')}
							>Reading</button>
						</li>

						<li class="menu-title text-[0.6rem] uppercase tracking-wide mt-1">Playback Speed</li>
						<li>
							<div class="flex flex-wrap gap-1 px-2 py-1">
								{#each SPEEDS as s (s)}
									<button
										class="btn btn-xs {audioState.playbackRate === s ? 'btn-primary' : 'btn-ghost'}"
										onclick={() => audioState.setPlaybackRate(s)}
									>{s}x</button>
								{/each}
							</div>
						</li>

						<li class="menu-title text-[0.6rem] uppercase tracking-wide mt-1">Reciter</li>
						<li>
							<a href="?openReciter=1">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
									<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
									<line x1="12" y1="19" x2="12" y2="23"/>
									<line x1="8" y1="23" x2="16" y2="23"/>
								</svg>
								Change Reciter
							</a>
						</li>

						<li class="menu-title text-[0.6rem] uppercase tracking-wide mt-1">Actions</li>
						<li>
							<a
								href={audioState.audioUrl || '#'}
								download
								target="_blank"
								rel="noreferrer"
								class={!audioState.audioUrl ? 'opacity-50 pointer-events-none' : ''}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
									<polyline points="7 10 12 15 17 10"/>
									<line x1="12" y1="15" x2="12" y2="3"/>
								</svg>
								Download Audio
							</a>
						</li>
						<li>
							<button onclick={() => audioState.stop()}>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="3" width="18" height="18" rx="2"/>
								</svg>
								Stop Playback
							</button>
						</li>
					</ul>
				</div>

				<!-- Volume control -->
				<div class="dropdown dropdown-top">
					<button tabindex="0" class="btn btn-ghost btn-sm btn-circle text-base-content/70" aria-label="Volume">
						{#if audioState.volume === 0}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
								<line x1="22" y1="9" x2="16" y2="15"/>
								<line x1="16" y1="9" x2="22" y2="15"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
								{#if audioState.volume > 0.5}
									<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
								{:else}
									<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
								{/if}
							</svg>
						{/if}
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div tabindex="0" class="dropdown-content z-[1] bg-base-100 rounded-box p-3 shadow border border-base-200 mb-2 w-44">
						<input
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={audioState.volume}
							oninput={(e) => audioState.setVolume(Number((e.target as HTMLInputElement).value))}
							class="range range-primary range-xs"
							aria-label="Volume"
						/>
						<div class="flex justify-between text-[0.6rem] text-base-content/50 mt-1">
							<span>0%</span><span>{Math.round(audioState.volume * 100)}%</span><span>100%</span>
						</div>
					</div>
				</div>

				<!-- Prev ayah -->
				<button
					class="btn btn-ghost btn-sm btn-circle text-base-content/80"
					onclick={() => audioState.prevVerse()}
					disabled={isLoading || audioState.currentVerseNumber <= 1}
					aria-label="Previous verse"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
					</svg>
				</button>

				<!-- Play / Pause (primary) -->
				<button
					class="btn btn-circle btn-primary btn-md"
					onclick={() => audioState.togglePlay()}
					disabled={isLoading}
					aria-label={audioState.isPlaying ? 'Pause' : 'Play'}
				>
					{#if isLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{:else if audioState.isPlaying}
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21"/>
						</svg>
					{/if}
				</button>

				<!-- Next ayah -->
				<button
					class="btn btn-ghost btn-sm btn-circle text-base-content/80"
					onclick={() => audioState.nextVerse()}
					disabled={isLoading || audioState.currentVerseNumber >= audioState.totalVerses}
					aria-label="Next verse"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 18l8.5-6L6 6v12zm10-12h2v12h-2z"/>
					</svg>
				</button>

				<!-- Close -->
				<button
					class="btn btn-ghost btn-sm btn-circle text-base-content/70"
					onclick={() => audioState.stop()}
					aria-label="Close player"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
