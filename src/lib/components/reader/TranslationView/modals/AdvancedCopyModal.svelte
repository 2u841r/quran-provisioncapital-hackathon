<script lang="ts">
  interface Props {
    arabicText: string;
    translations?: Array<{ text: string }> | null;
    verseKey: string;
    open: boolean;
    onClose: () => void;
  }

  let { arabicText, translations, verseKey, open, onClose }: Props = $props();

  let advCopyFormat = $state<'arabic' | 'translation' | 'both' | 'full'>('both');

  async function copyAdvanced() {
    const trans = translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
    let text = '';
    if (advCopyFormat === 'arabic') text = arabicText;
    else if (advCopyFormat === 'translation') text = trans;
    else if (advCopyFormat === 'both') text = `${arabicText}\n${trans}`;
    else text = `${arabicText}\n${trans}\n(${verseKey})`;
    await navigator.clipboard.writeText(text);
    onClose();
  }
</script>

{#if open}
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
  onclick={onClose}
  role="dialog"
  aria-modal="true"
  aria-label="Advanced copy"
  tabindex="-1"
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl"
    onclick={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="flex items-center justify-between px-5 py-4 border-b border-base-200">
      <h2 class="font-semibold">Advanced Copy</h2>
      <button class="btn btn-ghost btn-sm btn-circle" onclick={onClose}>✕</button>
    </div>
    <div class="p-5 flex flex-col gap-2">
      {#each [
        { v: 'arabic', label: 'Arabic only' },
        { v: 'translation', label: 'Translation only' },
        { v: 'both', label: 'Arabic + Translation' },
        { v: 'full', label: 'Arabic + Translation + Key' }
      ] as opt (opt.v)}
        <label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-base-200 transition-colors">
          <input
            type="radio"
            name="advCopyFormat"
            value={opt.v}
            checked={advCopyFormat === opt.v}
            onchange={() => (advCopyFormat = opt.v as typeof advCopyFormat)}
            class="radio radio-primary radio-sm"
          />
          <span class="text-sm">{opt.label}</span>
        </label>
      {/each}
      <button class="btn btn-primary btn-sm mt-2 w-full" onclick={copyAdvanced}>Copy</button>
    </div>
  </div>
</div>
{/if}
