<script lang="ts">
	import type { QuestionsResponse } from '$lib/types/quran';
	import EmptyState from './EmptyState.svelte';
	import LoadingState from './LoadingState.svelte';
	import { ANSWER_TYPE_LABELS } from './utils';

	interface Props {
		data: QuestionsResponse | null;
		loading: boolean;
		error: string | null;
		expandedAnswer: string | null;
		onToggleAnswer: (id: string) => void;
	}

	const { data, loading, error, expandedAnswer, onToggleAnswer }: Props = $props();
</script>

{#if loading}
	<LoadingState />
{:else if error}
	<EmptyState
		icon="lock"
		title="Answers requires API auth scope"
		description="Request production auth access from Quran.Foundation"
	/>
{:else if data && data.questions.length === 0}
	<EmptyState icon="plus" title="No answers found for this verse" />
{:else if data}
	<div class="divide-y divide-base-200">
		{#each data.questions as question (question.id)}
			<div class="px-4 py-3">
				<button
					class="flex w-full items-start gap-2 text-left"
					onclick={() => onToggleAnswer(question.id)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="mt-0.5 shrink-0 transition-transform {expandedAnswer === question.id
							? 'rotate-90'
							: ''}"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
					<div class="min-w-0 flex-1">
						<div class="mb-1 flex items-center gap-2">
							<span
								class="rounded px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide uppercase
								{question.type === 'CLARIFICATION'
									? 'bg-blue-500/10 text-blue-500'
									: question.type === 'TAFSIR'
										? 'bg-purple-500/10 text-purple-500'
										: 'bg-base-200 text-base-content/50'}"
							>
								{ANSWER_TYPE_LABELS[question.type] ?? question.type}
							</span>
						</div>
						<p class="text-sm leading-relaxed text-base-content/80">{question.body}</p>
					</div>
				</button>
				{#if expandedAnswer === question.id}
					<div class="pt-2 pl-6">
						{#each question.answers as answer (answer.id)}
							<div class="mb-3 border-l-2 border-primary/30 pl-3">
								<p class="mb-1.5 text-xs font-medium tracking-wide text-base-content/50 uppercase">
									Answer
								</p>
								<div class="prose-sm prose max-w-none leading-relaxed text-base-content/80">
									{@html answer.body}
								</div>
								{#if answer.answeredBy}
									<p class="mt-1 text-xs text-base-content/40">
										Answered by {answer.answeredBy}
									</p>
								{/if}
							</div>
						{/each}
						{#if question.summary}
							<div class="mb-2">
								<p class="mb-1 text-xs font-medium tracking-wide text-base-content/50 uppercase">
									Summary
								</p>
								<p class="text-xs text-base-content/50 italic">{question.summary}</p>
							</div>
						{/if}
						{#if question.references && question.references.length > 0}
							<div>
								<p class="mb-1 text-xs font-medium tracking-wide text-base-content/50 uppercase">
									References
								</p>
								<ul class="list-inside list-disc text-xs text-base-content/50">
									{#each question.references as reference, i (i)}
										<li>{reference}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
