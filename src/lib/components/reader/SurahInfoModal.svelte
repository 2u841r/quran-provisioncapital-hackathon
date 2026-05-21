<script lang="ts">
	import type { Chapter, ChapterInfo } from '$lib/types/quran';
	import { fetchChapterInfo } from '$lib/api/quran';

	interface Props {
		chapter: Chapter;
		open: boolean;
		onClose: () => void;
	}

	const { chapter, open, onClose }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let info = $state<ChapterInfo | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const chapterId = $derived(Number(chapter.id));

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});


	$effect(() => {
		if (!open || info) return;
		loading = true;
		error = null;
		fetchChapterInfo(fetch, chapterId)
			.then((r) => (info = r))
			.catch((e) => (error = String(e?.message ?? e)))
			.finally(() => (loading = false));
	});
</script>

<dialog
	bind:this={dialog}
	class="modal modal-bottom sm:modal-middle"
	onclose={onClose}
>
	<div class="modal-box max-w-2xl p-0 flex flex-col max-h-[90dvh]">
		<!-- Sticky title bar -->
		<div class="flex-none flex items-center justify-between px-5 py-3 border-b border-base-200 bg-base-100">
			<div class="text-sm font-semibold text-base-content">Surah Info</div>
			<form method="dialog">
				<button class="btn btn-ghost btn-sm btn-circle" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15" fill="currentColor">
						<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
					</svg>
				</button>
			</form>
		</div>

		<!-- Surah identity header — compact row on mobile, full chapter-header style on desktop -->
		<div class="flex-none border-b border-base-200">
			<!-- Mobile -->
			<div class="md:hidden flex items-center justify-center gap-3 px-5 py-3">
				<span class="chapter-icon text-primary leading-none shrink-0" style="font-size: 3rem;">{String(chapterId).padStart(3, '0')}</span>
				<div>
					<h2 class="text-base font-semibold leading-tight">Surah {chapter.nameSimple}</h2>
					<p class="text-xs text-base-content/60 mt-0.5 capitalize">{chapter.versesCount} ayahs · {chapter.revelationPlace}</p>
				</div>
			</div>
			<!-- Desktop -->
			<div class="hidden md:flex justify-center py-6 px-5">
				<div class="flex items-center gap-4">
					<div class="flex flex-col items-start gap-1">
						<div class="flex items-baseline gap-1.5">
							<p class="text-xl md:text-2xl font-semibold text-base-content">{chapterId}.</p>
							<p class="text-xl md:text-2xl font-semibold text-base-content">{chapter.nameSimple}</p>
						</div>
						<p class="text-sm text-base-content/60 capitalize">{chapter.versesCount} ayahs · {chapter.revelationPlace}</p>
					</div>
					<span class="chapter-icon text-primary leading-none" style="font-size: 4.5rem;">{String(chapterId).padStart(3, '0')}</span>
				</div>
			</div>
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto p-5">
			{#if loading}
				<div class="flex justify-center py-8">
					<span class="loading loading-spinner"></span>
				</div>
			{:else if error}
				<div class="text-sm text-error">{error}</div>
			{:else if info}
				{#if info.source}
					<p class="text-xs text-base-content/50 mb-3">{info.source}</p>
				{/if}
				<div class="prose prose-sm max-w-none text-base-content/85 [&_p]:mb-3 [&_a]:text-primary">
					{@html info.text}
				</div>
			{:else}
				<p class="text-sm text-base-content/50">No info available.</p>
			{/if}
		</div>

	</div>

	<form method="dialog" class="modal-backdrop">
		<button aria-label="Close">close</button>
	</form>
</dialog>

<style>
	.chapter-icon {
		font-family: 'surahnames';
	}
</style>
