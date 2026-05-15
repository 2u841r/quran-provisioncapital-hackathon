<script lang="ts">
	import { readerState } from '$lib/state/reader.svelte';
</script>

<div id="wbw-section" class="space-y-4">
	<div class="flex items-center justify-between py-1">
		<div>
			<div class="text-sm font-medium text-base-content">Word by Word Translation</div>
			<div class="text-xs text-base-content/50 mt-0.5">Show translation under each word</div>
		</div>
		<input
			type="checkbox"
			class="toggle toggle-primary toggle-sm"
			checked={readerState.wordByWord}
			onchange={() => readerState.toggleWordByWord()}
		/>
	</div>

	{#if readerState.wordByWord}
		<div class="flex items-center justify-between">
			<span class="text-xs font-medium text-base-content/50">Language</span>
			<div class="relative">
				<select
					class="appearance-none bg-base-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-base-content focus:outline-none focus:ring-1 focus:ring-primary"
					value={readerState.wordByWordLocale}
					onchange={() => {}}
				>
					<option value="en">English</option>
					<option value="ur">Urdu</option>
					<option value="bn">Bengali</option>
					<option value="tr">Turkish</option>
					<option value="id">Indonesian</option>
				</select>
				<svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
		</div>
	{/if}
</div>
