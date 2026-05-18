<script lang="ts">
	interface Props {
		title: string;
		description?: string;
		imageSrc?: string;
		selected?: boolean;
		playing?: boolean;
		size?: 'medium' | 'large' | 'curated';
		onPlay: () => void;
	}

	const {
		title,
		description,
		imageSrc,
		selected = false,
		playing = false,
		size = 'medium',
		onPlay
	}: Props = $props();
</script>

<article
	class="card bg-base-100 shadow-sm transition-colors {selected
		? 'ring-2 ring-primary/50'
		: ''} {size === 'curated'
		? 'w-56 shrink-0 md:w-72'
		: 'border border-base-300 hover:border-primary/40'}"
>
	<figure
		class="station-image group relative bg-base-200"
		class:station-image-large={size === 'large'}
		class:station-image-curated={size === 'curated'}
		class:station-image-medium={size !== 'large' && size !== 'curated'}
	>
		{#if imageSrc}
			<img
				src={imageSrc}
				alt={title}
				class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				loading="lazy"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="42"
					height="42"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.7"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M9 18V5l12-2v13" />
					<circle cx="6" cy="18" r="3" />
					<circle cx="18" cy="16" r="3" />
				</svg>
			</div>
		{/if}

		{#if size === 'curated'}
			<button
				type="button"
				class="station-image-overlay"
				onclick={onPlay}
				aria-label={playing ? `Pause ${title}` : `Play ${title}`}
			>
				<span
					class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg"
				>
					{#if playing}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M6 5h4v14H6zM14 5h4v14h-4z" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M8 5v14l11-7z" />
						</svg>
					{/if}
				</span>
			</button>
		{:else}
			<span class="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></span>
			<button
				type="button"
				class="absolute right-2 bottom-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-content shadow-lg {size ===
				'large'
					? 'h-9 w-9'
					: 'h-8 w-8'}"
				onclick={onPlay}
				aria-label={playing ? `Pause ${title}` : `Play ${title}`}
			>
				{#if playing}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M6 5h4v14H6zM14 5h4v14h-4z" />
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M8 5v14l11-7z" />
					</svg>
				{/if}
			</button>
		{/if}
	</figure>

	{#if size === 'curated'}
		<div class="card-body flex-row items-center justify-between gap-3 bg-base-200/70 p-4">
			<div class="min-w-0">
				<h2 class="card-title block truncate text-sm">{title}</h2>
				{#if description}
					<p class="line-clamp-2 text-xs leading-relaxed text-base-content/60">
						{description}
					</p>
				{/if}
			</div>
			<div class="card-actions shrink-0">
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={onPlay}
					aria-label={playing ? `Pause ${title}` : `Play ${title}`}
				>
					{#if playing}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M6 5h4v14H6zM14 5h4v14h-4z" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M8 5v14l11-7z" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<div class={size === 'large' ? 'card-body space-y-1 p-3' : 'card-body space-y-0.5 p-2'}>
			<h2 class="card-title block truncate text-sm">{title}</h2>
			{#if description}
				<p
					class="line-clamp-2 text-xs leading-relaxed text-base-content/60 {size === 'large'
						? 'min-h-9'
						: ''}"
				>
					{description}
				</p>
			{/if}
		</div>
	{/if}
</article>

<style>
	.station-image-large {
		aspect-ratio: 16 / 9;
	}

	.station-image-curated {
		position: relative;
		height: 7.875rem;
	}

	.station-image-medium {
		aspect-ratio: 1 / 1;
	}

	@media (min-width: 768px) {
		.station-image-curated {
			height: 10.125rem;
		}
	}

	.station-image-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border: 0;
		padding: 0;
		background: transparent;
		color: white;
		opacity: 0;
		transition:
			opacity 120ms ease,
			background-color 120ms ease;
	}

	.station-image-curated:hover .station-image-overlay,
	.station-image-overlay:focus-visible {
		background: rgb(0 0 0 / 60%);
		opacity: 1;
	}
</style>
