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

	const progress = $derived(
		audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0
	);
</script>

{#if audioState.isActive}
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 shadow-lg">
		<!-- Progress bar (thin line at top) -->
		<div
			class="relative h-1 bg-base-300 cursor-pointer"
			role="slider"
			aria-label="Seek"
			aria-valuenow={Math.round(progress)}
			aria-valuemin={0}
			aria-valuemax={100}
			tabindex="0"
			onclick={(e) => {
				const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
				audioState.seek(((e.clientX - rect.left) / rect.width) * audioState.duration);
			}}
			onkeydown={(e) => {
				if (e.key === 'ArrowLeft') audioState.seek(Math.max(0, audioState.currentTime - 5));
				if (e.key === 'ArrowRight') audioState.seek(Math.min(audioState.duration, audioState.currentTime + 5));
			}}
		>
			<div class="absolute inset-y-0 left-0 bg-primary transition-none" style="width: {progress}%"></div>
		</div>

		<div class="flex items-center gap-2 px-4 py-2">
			<!-- Chapter + verse info -->
			<div class="flex flex-col min-w-0 flex-1">
				<span class="text-xs font-semibold text-base-content truncate leading-tight">
					{audioState.chapterName || `Chapter ${audioState.loadedChapterId}`}
				</span>
				<span class="text-[0.65rem] text-base-content/50 leading-tight">
					{#if audioState.status === 'loading'}
						Loading...
					{:else}
						Verse {audioState.currentVerseNumber} / {audioState.totalVerses}
					{/if}
				</span>
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-1 shrink-0">
				<!-- Prev verse -->
				<button
					class="btn btn-ghost btn-sm btn-circle"
					onclick={() => audioState.prevVerse()}
					disabled={audioState.status === 'loading' || audioState.currentVerseNumber <= 1}
					aria-label="Previous verse"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
					</svg>
				</button>

				<!-- Play / Pause -->
				<button
					class="btn btn-circle btn-sm btn-primary"
					onclick={() => audioState.togglePlay()}
					disabled={audioState.status === 'loading'}
					aria-label={audioState.isPlaying ? 'Pause' : 'Play'}
				>
					{#if audioState.status === 'loading'}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if audioState.isPlaying}
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21"/>
						</svg>
					{/if}
				</button>

				<!-- Next verse -->
				<button
					class="btn btn-ghost btn-sm btn-circle"
					onclick={() => audioState.nextVerse()}
					disabled={audioState.status === 'loading' || audioState.currentVerseNumber >= audioState.totalVerses}
					aria-label="Next verse"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 18l8.5-6L6 6v12zm2-6 5.5-3.9v7.8L8 12zm8-6h2v12h-2z"/>
					</svg>
				</button>
			</div>

			<!-- Seek + time -->
			<div class="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
				<span class="text-[0.65rem] text-base-content/40 w-8 text-right shrink-0">{fmt(audioState.currentTime)}</span>
				<input
					type="range"
					min="0"
					max={audioState.duration || 1}
					step="0.5"
					value={audioState.currentTime}
					oninput={onSeek}
					class="range range-primary range-xs flex-1"
				/>
				<span class="text-[0.65rem] text-base-content/40 w-8 shrink-0">{fmt(audioState.duration)}</span>
			</div>

			<!-- Close -->
			<button
				class="btn btn-ghost btn-sm btn-circle shrink-0 ml-1"
				onclick={() => audioState.stop()}
				aria-label="Close player"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6 6 18M6 6l12 12"/>
				</svg>
			</button>
		</div>
	</div>
{/if}
