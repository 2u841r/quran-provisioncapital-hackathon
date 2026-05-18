<script lang="ts">
	import type { StudyTab, StudyTabItem } from './types';

	interface Props {
		tabs: StudyTabItem[];
		activeTab: StudyTab;
		onTabChange: (tab: StudyTab) => void;
	}

	const { tabs, activeTab, onTabChange }: Props = $props();
</script>

<div class="shrink-0 border-b border-base-200">
	<div class="flex scrollbar-none overflow-x-auto px-2" role="tablist" aria-label="Study tabs">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				class="shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
					{activeTab === tab.id
					? 'border-primary text-primary'
					: 'border-transparent text-base-content/50 hover:text-base-content'}"
				onclick={() => onTabChange(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>
