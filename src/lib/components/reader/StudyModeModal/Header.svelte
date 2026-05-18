<script lang="ts">
	interface Props {
		verseKey: string;
		onClose: () => void;
	}

	const { verseKey, onClose }: Props = $props();
</script>

<div class="flex shrink-0 justify-center pt-2.5 pb-1 sm:hidden">
	<div class="h-1 w-10 rounded-full bg-base-300"></div>
</div>

<div class="flex shrink-0 items-center justify-between px-4 pt-2 pb-1">
	<span class="font-mono text-xs text-base-content/50 select-none">{verseKey}</span>
	<button class="btn btn-circle btn-ghost btn-sm" onclick={onClose} aria-label="Close">
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
