<script lang="ts">
  interface Props {
    verseKey: string;
    resourceName?: string | null;
    open: boolean;
    onClose: () => void;
  }

  let { verseKey, resourceName, open, onClose }: Props = $props();

  let feedbackText = $state('');
  let feedbackSent = $state(false);

  async function submitFeedback() {
    feedbackSent = true;
    setTimeout(() => {
      onClose();
      feedbackSent = false;
      feedbackText = '';
    }, 1500);
  }
</script>

{#if open}
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
  onclick={onClose}
  role="dialog"
  aria-modal="true"
  aria-label="Translation feedback"
  tabindex="-1"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl"
    onclick={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
      <h2 class="font-semibold">Translation Feedback</h2>
      <button class="btn btn-ghost btn-sm btn-circle" onclick={onClose}>✕</button>
    </div>
    <div class="p-5 flex flex-col gap-3">
      {#if feedbackSent}
        <p class="text-sm text-success text-center py-4">Thank you for your feedback!</p>
      {:else}
        <p class="text-xs text-base-content/50">Verse {verseKey} · {resourceName ?? 'Translation'}</p>
        <textarea
          class="textarea textarea-bordered w-full text-sm resize-none"
          rows="4"
          placeholder="Describe the issue with this translation..."
          value={feedbackText}
          oninput={(e) => feedbackText = (e.target as HTMLTextAreaElement).value}
        ></textarea>
        <button
          class="btn btn-primary btn-sm w-full"
          disabled={!feedbackText.trim()}
          onclick={submitFeedback}
        >Submit</button>
      {/if}
    </div>
  </div>
</div>
{/if}
