<script lang="ts">
	import type { ReflectionItem, ReflectionsResponse } from '$lib/types/quran';

	type Accent = 'primary' | 'secondary';

	interface Props {
		data: ReflectionsResponse | null;
		loading: boolean;
		error: string | null;
		accent: Accent;
		label: string;
		expandedIds: Set<number>;
		onToggleExpand: (id: number) => void;
	}

	const { data, loading, error, accent, label, expandedIds, onToggleExpand }: Props = $props();

	const MAX_TRUNCATE_LENGTH = 500;

	const disclaimerCls: Record<Accent, string> = {
		primary: 'bg-warning/5 border-warning/10',
		secondary: 'bg-secondary/5 border-secondary/10'
	};
	const avatarFallbackCls: Record<Accent, string> = {
		primary: 'bg-primary/10 text-primary',
		secondary: 'bg-secondary/10 text-secondary'
	};
	const hoverCls: Record<Accent, string> = {
		primary: 'hover:text-primary',
		secondary: 'hover:text-secondary'
	};
	const verifiedCls: Record<Accent, string> = {
		primary: 'text-primary',
		secondary: 'text-secondary'
	};
	const seeMoreCls: Record<Accent, string> = {
		primary: 'text-primary',
		secondary: 'text-secondary'
	};
	const btnCls: Record<Accent, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary'
	};

	function formatRelativeDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 30) return `${diffDays} days ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	}

	function getAuthorName(item: ReflectionItem): string {
		return item.author
			? `${item.author.firstName ?? ''} ${item.author.lastName ?? ''}`.trim() ||
					item.author.username
			: 'Anonymous';
	}

	function getAuthorAvatar(item: ReflectionItem): string | undefined {
		return item.author?.avatarUrl;
	}

	function isLongText(body: string): boolean {
		return body.length > MAX_TRUNCATE_LENGTH;
	}

	function truncateBody(body: string): string {
		if (body.length <= MAX_TRUNCATE_LENGTH) return body;
		return body.slice(0, MAX_TRUNCATE_LENGTH) + '...';
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-16">
		<span class="loading loading-md loading-spinner text-primary"></span>
	</div>
{:else if error}
	<p class="py-12 text-center text-sm text-error">{error}</p>
{:else if data && data.data.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 py-20 text-base-content/30">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
		</svg>
		<p class="text-sm">No {label.toLowerCase()} found for this verse</p>
	</div>
{:else if data}
	<div class="border-b px-4 py-3 {disclaimerCls[accent]}">
		<p class="text-xs leading-relaxed text-base-content/50">
			{label} are community contributions and do not necessarily represent the views of Quran.com
		</p>
	</div>
	<div class="divide-y divide-base-200">
		{#each data.data as item (item.id)}
			{@const authorName = getAuthorName(item)}
			{@const avatarUrl = getAuthorAvatar(item)}
			{@const isExpanded = expandedIds.has(item.id)}
			<div class="px-4 py-4">
				<div class="mb-2 flex items-center gap-2">
					{#if avatarUrl}
						<img src={avatarUrl} alt="" class="h-7 w-7 rounded-full object-cover" />
					{:else}
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] font-bold {avatarFallbackCls[
								accent
							]}"
						>
							{authorName.charAt(0).toUpperCase()}
						</div>
					{/if}
					<a
						href="https://quranreflect.com/profile/{item.author?.username}"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs font-medium text-base-content/70 transition-colors {hoverCls[accent]}"
					>
						{authorName}
					</a>
					{#if item.verified}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="currentColor"
							class={verifiedCls[accent]}
							><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg
						>
					{/if}
					<span class="text-xs text-base-content/30">{formatRelativeDate(item.createdAt)}</span>
				</div>
				{#if item.body}
					<div class="prose-sm prose max-w-none leading-relaxed text-base-content/80">
						{@html isExpanded || !isLongText(item.body) ? item.body : truncateBody(item.body)}
					</div>
					{#if isLongText(item.body)}
						<button
							class="mt-1 text-xs hover:underline {seeMoreCls[accent]}"
							onclick={() => onToggleExpand(item.id)}
						>
							{isExpanded ? 'See less' : 'See more'}
						</button>
					{/if}
				{/if}
				<div class="mt-3 flex items-center gap-4 text-xs text-base-content/40">
					<a
						href="https://quranreflect.com/post/{item.id}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1 transition-colors {hoverCls[accent]}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path
								d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
							/></svg
						>
						{item.likesCount}
					</a>
					<a
						href="https://quranreflect.com/post/{item.id}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1 transition-colors {hoverCls[accent]}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg
						>
						{item.commentsCount}
					</a>
				</div>
			</div>
		{/each}
	</div>
	<div class="flex justify-center py-4">
		<a
			href="https://quranreflect.com"
			target="_blank"
			rel="noopener noreferrer"
			class="btn rounded-full btn-outline btn-sm {btnCls[accent]}"
		>
			Read more on QuranReflect
		</a>
	</div>
{/if}
