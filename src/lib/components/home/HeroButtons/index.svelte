<script lang="ts">
	interface Props {
		onNavigate: () => void;
	}

	const { onNavigate }: Props = $props();

	let popularOpen = $state(false);

	const popularLinks = [
		{ label: '67. Al-Mulk', href: '/67' },
		{ label: '18. Al-Kahf', href: '/18' },
		{ label: '36. Ya-Sin', href: '/36' },
		{ label: 'Ayatul Kursi', href: '/2?startingVerse=255' },
		{ label: '2. Al-Baqarah 285-286', href: '/2/285-286' }
	];
</script>

<div class="relative mt-2 flex flex-col items-center md:mt-4">
	{#if !popularOpen}
		<div class="flex gap-2 md:gap-[15px]">
			<button
				class="btn rounded-full border-none bg-base-100 text-base-content/60 shadow-sm btn-ghost btn-sm md:btn-md"
				onclick={onNavigate}
				data-testid="navigate-quran-button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="8" y1="6" x2="21" y2="6" />
					<line x1="8" y1="12" x2="21" y2="12" />
					<line x1="8" y1="18" x2="21" y2="18" />
					<line x1="3" y1="6" x2="3.01" y2="6" />
					<line x1="3" y1="12" x2="3.01" y2="12" />
					<line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
				Navigate Quran
			</button>
			<button
				class="btn rounded-full border-none bg-base-100 text-base-content/60 shadow-sm btn-ghost btn-sm md:btn-md"
				onclick={() => (popularOpen = true)}
				data-testid="popular-button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m23 6-9.5 9.5-5-5L1 18" />
					<path d="M17 6h6v6" />
				</svg>
				Popular
			</button>
		</div>
	{/if}

	{#if popularOpen}
		<div class="popular-dropdown mt-1 w-[min(92vw,46rem)] rounded-3xl bg-base-100 p-4 shadow-xl">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 text-sm text-base-content/60 md:text-base">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m23 6-9.5 9.5-5-5L1 18" />
						<path d="M17 6h6v6" />
					</svg>
					Popular
				</div>
				<button
					class="btn btn-circle btn-ghost btn-sm"
					onclick={() => (popularOpen = false)}
					aria-label="Close popular links"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="my-2 h-px bg-base-200"></div>
			<p class="mb-2 text-sm font-semibold text-base-content">Chapters and verses</p>
			<div class="flex flex-wrap gap-2">
				{#each popularLinks as link (link.href)}
					<a
						href={link.href}
						class="btn rounded-full border-none bg-base-200 text-xs font-medium text-base-content/70 btn-sm hover:bg-base-300 md:text-sm"
					>
						<span>{link.label}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.25"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</a>
				{/each}
			</div>
			<div class="my-3 h-px bg-base-200"></div>
			<a
				href="/radio"
				class="btn-compact btn mx-auto flex w-fit rounded-full border-none bg-base-200 text-sm font-medium text-base-content/70 hover:bg-base-300"
				data-testid="play-radio-button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M8 5v14l11-7z" />
				</svg>
				Listen to Radio
			</a>
		</div>
	{/if}
</div>

<style>
	.popular-dropdown {
		animation: slide-up-fade 0.1s ease-out forwards;
	}
	@keyframes slide-up-fade {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
