<script lang="ts">
  interface Props {
    verseKey: string;
    onTabClick: (tab: string) => void;
  }

  let { verseKey, onTabClick }: Props = $props();

  const tabs = [
    { id: 'tafsir', label: 'Tafsirs' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'reflections', label: 'Reflections' },
    { id: 'answers', label: 'Answers' }
  ];
</script>

<div class="flex items-center justify-between border-t border-base-200 px-1 sm:px-2">
  {#each tabs as tab, i (tab.id)}
    {#if i > 0}
      <div class="h-3.5 w-px bg-base-300 shrink-0"></div>
    {/if}
    <button
      data-testid="bottom-action-tab-{tab.id}"
      class="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2.5 text-[0.65rem] sm:text-xs shrink-0 transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5 sm:[&_svg]:w-4 sm:[&_svg]:h-4 text-base-content/50 hover:text-base-content"
      onclick={() => onTabClick(tab.id)}
    >
      {#if tab.id === 'tafsir'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      {:else if tab.id === 'lessons'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><path fill="currentColor" d="M5.434 13.804 10 16.484l4.566-2.68V10.91l1.534-.89v4.74l-6.1 3.58-6.1-3.58v-4.74l1.534.89zM2.888 6.548 10 10.58l7.112-4.032L10 2.786zM19.1 11.545h-1.486V7.993l-7.614 4.317-9.05-5.13V5.896l9.05-4.79 9.1 4.79z"/></svg>
      {:else if tab.id === 'reflections'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>
      {:else if tab.id === 'answers'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 21" fill="none"><path fill="currentColor" d="M17.01 9.419s1.75-.895 2.629 0a1.277 1.277 0 0 1 0 1.784c-.878.89-2.628 0-2.628 0zm-16.645 0c.876-.895 2.628 0 2.628 0v1.784s-1.75.89-2.628 0a1.28 1.28 0 0 1 0-1.784M10.878.496c.573.585 0 2.677 0 2.677H9.126S8.64.992 9.126.496a1.22 1.22 0 0 1 1.752 0m-7.079 2.23c1.075 0 1.866 1.91 1.866 1.91L4.421 5.894s-1.866-.937-1.866-1.891c0-.703.555-1.276 1.244-1.276m10.54 1.901s.92-1.9 1.857-1.9c.692 0 1.252.57 1.252 1.276 0 1.06-1.866 1.891-1.866 1.891zm-4.337.33c1.394 0 2.73.564 3.717 1.568a5.4 5.4 0 0 1 1.54 3.786c0 1.98-1.06 3.712-2.629 4.64v1.606a.9.9 0 0 1-.257.63.87.87 0 0 1-.619.262H8.25a.87.87 0 0 1-.62-.261.9.9 0 0 1-.256-.631V14.95a5.38 5.38 0 0 1-2.629-4.64c0-1.42.554-2.782 1.54-3.786a5.2 5.2 0 0 1 3.717-1.568"/></svg>
      {/if}
      {tab.label}
    </button>
  {/each}
</div>
