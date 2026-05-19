<script lang="ts">
	import pinRaw from '$lib/assets/icons/pin.svg?raw';
	import advancedCopyRaw from '$lib/assets/icons/advanced_copy.svg?raw';
	import bxBookRaw from '$lib/assets/icons/bx-book.svg?raw';
	import repeatRaw from '$lib/assets/icons/repeat-new.svg?raw';
	import translationRaw from '$lib/assets/icons/translation.svg?raw';
	import translationFeedbackRaw from '$lib/assets/icons/translation-feedback.svg?raw';
	import codeEmbedRaw from '$lib/assets/icons/code-embed.svg?raw';
	import settingsRaw from '$lib/assets/icons/settings-stroke.svg?raw';

	function svgIcon(raw: string): string {
		return raw
			.replace(/fill="(?!none)[^"]+"/g, 'fill="currentColor"')
			.replace(/stroke="(?!none|currentColor)[^"]+"/g, 'stroke="currentColor"')
			.replace(/<svg ([^>]*)>/, (_, attrs) => {
				const cleaned = attrs
					.replace(/\s*width="[^"]*"/g, '')
					.replace(/\s*height="[^"]*"/g, '')
					.replace(/\s*class="[^"]*"/g, '');
				return `<svg width="14" height="14" ${cleaned}>`;
			});
	}

	interface Props {
		verseKey: string;
		verseNumber: number;
		chapterId?: number | string;
		isCurrentVerse: boolean;
		isPlaying: boolean;
		isLoading: boolean;
		isAudioActive: boolean;
		bookmarked: boolean;
		bookmarkLoading: boolean;
		onTogglePlay: () => void;
		onToggleBookmark: () => void;
		onCopyVerse: () => void;
		onShare: () => void;
		onNote: () => void;
		onWbw: () => void;
		onAdvCopy: () => void;
		onRepeat: () => void;
		onFeedback: () => void;
		onOpenTranslations?: () => void;
		onOpenSettings?: () => void;
	}

	const {
		verseKey,
		verseNumber,
		chapterId,
		isCurrentVerse,
		isPlaying,
		isLoading,
		isAudioActive,
		bookmarked,
		bookmarkLoading,
		onTogglePlay,
		onToggleBookmark,
		onCopyVerse,
		onShare,
		onNote,
		onWbw,
		onAdvCopy,
		onRepeat,
		onFeedback,
		onOpenTranslations,
		onOpenSettings
	}: Props = $props();

	let overflowOpen = $state(false);

	const chId = $derived(verseKey.split(':')[0]);
	const hrefChapterId = $derived(chapterId ?? chId);
</script>

<div class="flex items-center justify-between px-4 pt-4 pb-2">
	<!-- Left: verse key, play, bookmark -->
	<div class="flex items-center gap-1">
		<a
			href="/{hrefChapterId}?startingVerse={verseNumber}"
			class="btn btn-ghost btn-xs font-mono text-base-content/60 hover:text-primary px-2"
		>
			{verseKey}
		</a>

		<button
			class="btn btn-ghost btn-xs btn-circle {isCurrentVerse && isAudioActive ? 'text-primary' : 'text-base-content/50'}"
			onclick={onTogglePlay}
			aria-label={isPlaying ? 'Pause' : `Play verse ${verseKey}`}
		>
			{#if isLoading}
				<span class="loading loading-spinner loading-xs"></span>
			{:else if isPlaying}
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
					<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m5 3 14 9-14 9z"/>
				</svg>
			{/if}
		</button>

		<button
			class="btn btn-ghost btn-xs btn-circle {bookmarked ? 'text-warning' : 'text-base-content/40'} hover:text-warning transition-colors"
			aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark verse'}
			onclick={onToggleBookmark}
			disabled={bookmarkLoading}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
			</svg>
		</button>
	</div>

	<!-- Right: copy, share, note, more -->
	<div class="flex items-center gap-1">
		<button class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content" onclick={onCopyVerse} aria-label="Copy verse">
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
			</svg>
		</button>

		<button class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content" onclick={onShare} aria-label="Share">
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
				<path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
			</svg>
		</button>

		<button class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content" onclick={onNote} aria-label="Add a note or reflection" title="Add a note or reflection">
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
				<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
			</svg>
		</button>

		<!-- Overflow menu -->
		<div class="relative">
			<button
				class="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
				onclick={() => (overflowOpen = !overflowOpen)}
				aria-label="More actions"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
					<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
				</svg>
			</button>

			{#if overflowOpen}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-40"
					onclick={() => (overflowOpen = false)}
					onkeydown={(e) => e.key === 'Escape' && (overflowOpen = false)}
				></div>
				<div class="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-base-300 bg-base-100 shadow-lg py-1 text-sm">
					{#each [
						{ icon: pinRaw, label: 'Pin & compare', action: () => { overflowOpen = false; } },
						{ icon: advancedCopyRaw, label: 'Advanced Copy', action: () => { overflowOpen = false; onAdvCopy(); } },
						{ icon: bxBookRaw, label: 'Word By Word', action: () => { overflowOpen = false; onWbw(); } },
						{ icon: repeatRaw, label: 'Repeat Verse', action: () => { overflowOpen = false; onRepeat(); } },
						{ icon: translationRaw, label: 'Translations', action: () => { overflowOpen = false; onOpenTranslations?.(); } },
						{ icon: translationFeedbackRaw, label: 'Translation Feedback', action: () => { overflowOpen = false; onFeedback(); } },
						{ icon: settingsRaw, label: 'Settings', action: () => { overflowOpen = false; onOpenSettings?.(); } }
					] as item (item.label)}
						<button
							class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors"
							onclick={item.action}
						>
							<span class="shrink-0">{@html svgIcon(item.icon)}</span>
							{item.label}
						</button>
					{/each}
					<button
						class="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors"
						onclick={() => { overflowOpen = false; window.open(`https://quran.com/embed?verses=${encodeURIComponent(verseKey)}`, '_blank'); }}
					>
						<span class="shrink-0">{@html svgIcon(codeEmbedRaw)}</span>
						Embed Widget
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
