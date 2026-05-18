<script lang="ts">
	import type { TafsirContent, TafsirInfo } from '$lib/types/quran';
	import LoadingState from './LoadingState.svelte';
	import { displayLanguage } from './utils';

	interface Props {
		listLoaded: boolean;
		languageOptions: string[];
		selectedLanguage: string;
		filteredTafsirs: TafsirInfo[];
		selectedTafsirId: number;
		content: TafsirContent | null;
		loading: boolean;
		error: string | null;
		onSelectLanguage: (lang: string) => void;
		onSelectTafsir: (id: number) => void;
	}

	const {
		listLoaded,
		languageOptions,
		selectedLanguage,
		filteredTafsirs,
		selectedTafsirId,
		content,
		loading,
		error,
		onSelectLanguage,
		onSelectTafsir
	}: Props = $props();
</script>

{#if listLoaded}
	<div class="border-b border-base-200">
		<div class="flex items-center gap-3 px-4 py-2.5">
			<div class="dropdown dropdown-bottom">
				<button
					tabindex="0"
					class="hover:border-base-400 flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-sm text-base-content/70 transition-colors hover:text-base-content"
				>
					<span>{displayLanguage(selectedLanguage)}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="dropdown-content menu z-50 mt-1 max-h-64 min-w-40 flex-nowrap overflow-y-auto menu-sm rounded-lg border border-base-200 bg-base-100 p-1 shadow-lg"
				>
					<li class="menu-title px-2 pt-1 pb-0.5 text-[0.65rem] tracking-wide uppercase opacity-50">
						Languages
					</li>
					{#each languageOptions as lang (lang)}
						<li>
							<button
								class="py-1.5 text-sm {selectedLanguage === lang ? 'active' : ''}"
								onclick={() => onSelectLanguage(lang)}
							>
								{displayLanguage(lang)}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		{#if filteredTafsirs.length > 0}
			<div class="flex scrollbar-none gap-1.5 overflow-x-auto px-4 pb-3">
				{#each filteredTafsirs as tafsir (tafsir.id)}
					<button
						class="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
							{selectedTafsirId === tafsir.id
							? 'border-primary bg-primary/10 text-primary'
							: 'border-base-200 text-base-content/60 hover:border-base-300 hover:text-base-content'}"
						onclick={() => onSelectTafsir(tafsir.id)}
					>
						{tafsir.translatedName?.name ?? tafsir.name}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

{#if loading}
	<LoadingState />
{:else if error}
	<p class="py-12 text-center text-sm text-error">{error}</p>
{:else if content}
	<div class="px-4 py-4">
		<p class="mb-3 text-xs tracking-wide text-base-content/40 uppercase">
			{content.resourceName}
		</p>
		<div class="prose-sm prose max-w-none leading-relaxed text-base-content/80">
			{@html content.text}
		</div>
	</div>
{/if}
