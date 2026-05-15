<script lang="ts">
	import { audioState } from '$lib/state/audio.svelte';

	const isVisible = $derived(audioState.status !== 'idle');

	function formatTime(sec: number): string {
		if (!isFinite(sec)) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	function onSeek(e: Event) {
		const input = e.target as HTMLInputElement;
		audioState.seek(Number(input.value));
	}
</script>

{#if isVisible}
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 px-4 py-2 flex items-center gap-3">
		<!-- Verse key -->
		<span class="text-xs font-mono text-base-content/50 w-12 shrink-0">
			{audioState.currentVerseKey ?? ''}
		</span>

		<!-- Play / Pause -->
		<button
			class="btn btn-circle btn-sm btn-primary shrink-0"
			onclick={() => audioState.isPlaying ? audioState.pause() : audioState.play(audioState.currentVerseKey!)}
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

		<!-- Seek bar -->
		<div class="flex-1 flex items-center gap-2 min-w-0">
			<span class="text-xs text-base-content/40 w-8 text-right shrink-0">{formatTime(audioState.currentTime)}</span>
			<input
				type="range"
				min="0"
				max={audioState.duration || 1}
				step="0.1"
				value={audioState.currentTime}
				oninput={onSeek}
				class="range range-primary range-xs flex-1"
			/>
			<span class="text-xs text-base-content/40 w-8 shrink-0">{formatTime(audioState.duration)}</span>
		</div>

		<!-- Stop -->
		<button
			class="btn btn-ghost btn-sm btn-circle shrink-0"
			onclick={() => audioState.stop()}
			aria-label="Stop"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
				<rect x="4" y="4" width="16" height="16"/>
			</svg>
		</button>
	</div>
{/if}
