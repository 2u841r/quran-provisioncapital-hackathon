<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';

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
				<!-- Overflow / settings (stub) -->
				<button
					class="btn btn-ghost btn-sm btn-circle text-base-content/70"
					aria-label="More"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M13.25 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M2.75 8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"/></svg>
				</button>

				<!-- Volume (stub) -->
				<button
					class="btn btn-ghost btn-sm btn-circle text-base-content/70"
					aria-label="Volume"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
					</svg>
				</button>

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
