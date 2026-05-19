<script lang="ts">
	import type { HadithItem } from '$lib/types/quran';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';
	import {
		formatHtmlBreaks,
		getArabicText,
		getEnglishText,
		getGrades,
		parseHadithNumbers
	} from './utils';

	interface Props {
		items: HadithItem[];
		loading: boolean;
		error: string | null;
		hasMore: boolean;
		loadingMore: boolean;
		shownArabic: Set<number>;
		onRetry: () => void;
		onLoadMore: () => void;
		onToggleArabic: (urn: number) => void;
	}

	const {
		items,
		loading,
		error,
		hasMore,
		loadingMore,
		shownArabic,
		onRetry,
		onLoadMore,
		onToggleArabic
	}: Props = $props();
</script>

{#if loading}
	<LoadingState />
{:else if error}
	<div class="flex flex-col items-center justify-center gap-3 py-16">
		<p class="text-sm text-error">{error}</p>
		<button class="btn btn-ghost btn-sm" onclick={onRetry}>Retry</button>
	</div>
{:else if items.length === 0}
	<EmptyState
		icon="book"
		title="No hadiths for this verse"
		description="No related hadiths found in our database"
	/>
{:else}
	<div class="border-b border-base-200 bg-base-200/40 px-4 py-3">
		<p class="text-xs leading-relaxed text-base-content/50">
			Hadiths are from
			<a
				href="https://sunnah.com/bukhari"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline underline-offset-2">Sahih al-Bukhari</a
			>
			and
			<a
				href="https://sunnah.com/muslim"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline underline-offset-2">Sahih Muslim</a
			>
			via sunnah.com
		</p>
	</div>
	<div class="divide-y divide-base-200">
		{#each items as hadith (hadith.urn)}
			{@const englishText = getEnglishText(hadith)}
			{@const arabicText = getArabicText(hadith)}
			{@const grades = getGrades(hadith)}
			<div class="px-4 py-4">
				<div class="mb-2 flex flex-wrap items-center gap-2">
					<span class="text-xs font-semibold text-primary">{hadith.name}</span>
					{#each parseHadithNumbers(hadith.hadithNumber) as num, i (i)}
						<a
							href="https://sunnah.com/{hadith.collection}/{num}"
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs text-base-content/40 transition-colors hover:text-primary"
						>
							#{num}
						</a>
					{/each}
				</div>
				{#if grades}
					<p class="mb-2 text-xs text-base-content/40">{grades}</p>
				{/if}
				{#if englishText}
					<div class="prose-sm mb-3 prose max-w-none leading-relaxed text-base-content/80">
						{@html formatHtmlBreaks(englishText)}
					</div>
				{/if}
				{#if arabicText}
					<button
						class="text-xs text-base-content/40 transition-colors select-none hover:text-base-content/60"
						onclick={() => onToggleArabic(hadith.urn)}
						aria-expanded={shownArabic.has(hadith.urn)}
					>
						{shownArabic.has(hadith.urn) ? 'Hide Arabic' : 'Show Arabic'}
					</button>
					{#if shownArabic.has(hadith.urn)}
						<div
							class="prose-sm mt-2 prose max-w-none text-right font-[--font-arabic] leading-relaxed"
							dir="rtl"
							lang="ar"
						>
							{@html formatHtmlBreaks(arabicText)}
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
	{#if hasMore}
		<div class="flex justify-center py-4">
			<button class="btn btn-ghost btn-sm" onclick={onLoadMore} disabled={loadingMore}>
				{#if loadingMore}
					<span class="loading loading-xs loading-spinner"></span>
					Loading...
				{:else}
					Load more
				{/if}
			</button>
		</div>
	{/if}
{/if}
