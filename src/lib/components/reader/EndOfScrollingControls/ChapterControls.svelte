<script lang="ts">
	interface Props {
		chapterId: number;
		chapterName: string;
	}

	const { chapterId, chapterName }: Props = $props();

	const nextChapterId = $derived(chapterId < 114 ? chapterId + 1 : null);
	const prevChapterId = $derived(chapterId > 1 ? chapterId - 1 : null);
</script>

<div class="end-of-surah mt-8 mb-4 border-t border-base-200 pt-8 text-center">
	<h2 class="text-base font-semibold text-base-content/70 mb-1">End of Surah</h2>
	<p class="text-sm text-base-content/50 mb-6">{chapterName}</p>

	<div class="flex items-center justify-center gap-3 flex-wrap">
		{#if prevChapterId}
			<a href="/{prevChapterId}" class="btn btn-sm btn-ghost rounded-full">
				← Surah {prevChapterId}
			</a>
		{/if}
		{#if nextChapterId}
			<a href="/{nextChapterId}" class="btn btn-primary btn-sm rounded-full">
				Continue Reading
			</a>
		{/if}
	</div>
</div>
