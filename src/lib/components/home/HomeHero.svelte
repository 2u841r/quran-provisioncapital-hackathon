<script lang="ts">
	import backgroundSvg from '$lib/assets/background.svg?raw';
	import logoSvg from '$lib/assets/logo_main.svg?raw';
	import type { Chapter } from '$lib/types/quran';
	import SearchInput from './SearchInput.svelte';
	import HeroButtons from './HeroButtons/index.svelte';

	interface Props {
		surahs: (Chapter & { id: number })[];
		onNavigate: () => void;
	}

	const { surahs, onNavigate }: Props = $props();
</script>

<div class="hero-outer relative isolate z-10">
	<div
		class="hero-bg absolute inset-0 z-0 overflow-hidden bg-base-200"
		style="--color-calligraphy: var(--color-base-300);"
	>
		<div class="hero-svg" style="transform: translateY(-40%)">
			{@html backgroundSvg}
		</div>
	</div>

	<div class="relative z-10">
		<div class="mx-auto flex max-w-3xl flex-col items-center px-2 py-5 md:py-[30px]">
			<div class="hidden pb-5 md:block">
				<div class="logo-main" aria-label="Quran.com" style="color: var(--color-primary);">
					{@html logoSvg}
				</div>
			</div>

			<SearchInput {surahs} />

			<HeroButtons {onNavigate} />
		</div>
	</div>
</div>

<style>
	.hero-svg :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
	.logo-main :global(svg) {
		height: 3rem;
		width: auto;
		display: block;
	}
</style>
