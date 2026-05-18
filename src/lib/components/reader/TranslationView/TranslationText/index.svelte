<script lang="ts">
  interface Props {
    translations?: Array<{ resourceId?: number; resourceName?: string | null; text: string }> | null;
    showTranslations: boolean;
  }

  let { translations, showTranslations }: Props = $props();
</script>

{#if showTranslations && translations?.length}
  <div class="space-y-2">
    {#each translations as tr (tr.resourceId)}
      <div>
        {#if translations.length > 1}
          <p class="text-[0.6rem] text-base-content/40 mb-0.5 uppercase tracking-wide">{tr.resourceName}</p>
        {/if}
        <p class="text-sm leading-relaxed text-base-content/75">{@html tr.text}</p>
      </div>
    {/each}
  </div>
{/if}
