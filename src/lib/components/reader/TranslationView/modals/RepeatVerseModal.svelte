<script lang="ts">
  import { audioState } from '$lib/state/audio.svelte';

  interface Props {
    verse: { verseNumber: number; verseKey: string; chapterId?: number | string };
    chapterName: string;
    chapterId?: number;
    open: boolean;
    onClose: () => void;
  }

  let { verse, chapterName, chapterId, open, onClose }: Props = $props();

  let repeatMode = $state<'single' | 'range' | 'chapter'>('single');
  let repeatFromVerse = $state(verse.verseNumber);
  let repeatToVerse = $state(verse.verseNumber);
  let repeatEachVerse = $state(2);
  let repeatRange = $state(2);
  let repeatDelay = $state(1);
  const INFINITY_THRESHOLD = 8;

  function repeatCountDisplay(n: number): string {
    return n === Infinity ? '∞' : String(n);
  }
  function incRepeatEachVerse() {
    repeatEachVerse = repeatEachVerse >= INFINITY_THRESHOLD ? Infinity : repeatEachVerse + 1;
  }
  function decRepeatEachVerse() {
    if (repeatEachVerse === Infinity) repeatEachVerse = INFINITY_THRESHOLD;
    else if (repeatEachVerse > 1) repeatEachVerse -= 1;
  }
  function incRepeatRange() {
    repeatRange = repeatRange >= INFINITY_THRESHOLD ? Infinity : repeatRange + 1;
  }
  function decRepeatRange() {
    if (repeatRange === Infinity) repeatRange = INFINITY_THRESHOLD;
    else if (repeatRange > 1) repeatRange -= 1;
  }
  function incRepeatDelay() {
    repeatDelay = Math.round((repeatDelay + 0.5) * 10) / 10;
  }
  function decRepeatDelay() {
    if (repeatDelay > 0) repeatDelay = Math.round((repeatDelay - 0.5) * 10) / 10;
  }
  function onRepeatModeChange(mode: string) {
    repeatMode = mode as 'single' | 'range' | 'chapter';
    if (mode === 'single') {
      repeatFromVerse = verse.verseNumber;
      repeatToVerse = verse.verseNumber;
    }
  }

  function startRepeat() {
    onClose();
    const cid = chapterId ?? verse.chapterId;
    const from = repeatMode === 'chapter' ? 1 : repeatFromVerse;
    const totalRangeCycles =
      repeatMode === 'single' ? 1 : repeatRange === Infinity ? 9999 : repeatRange;
    const totalVerseCycles = repeatEachVerse === Infinity ? 9999 : repeatEachVerse;
    const delayMs = repeatDelay * 1000;

    let rangeCycle = 0;
    let verseCycle = 0;
    let curVerse = from;
    let watchInterval: ReturnType<typeof setInterval> | null = null;
    let active = true;

    function stopRepeat() {
      active = false;
      if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
      }
    }
    function getTo() {
      if (repeatMode === 'chapter') return audioState.verseTimings.length || 999;
      if (repeatMode === 'single') return repeatFromVerse;
      return repeatToVerse;
    }
    function onVerseDone() {
      if (!active) return;
      verseCycle++;
      const to = getTo();
      const next = () => {
        if (!active) return;
        if (verseCycle < totalVerseCycles) {
          playVerseRepeat(curVerse);
        } else {
          verseCycle = 0;
          curVerse++;
          if (curVerse > to) {
            curVerse = from;
            rangeCycle++;
            if (rangeCycle >= totalRangeCycles) {
              stopRepeat();
              return;
            }
          }
          playVerseRepeat(curVerse);
        }
      };
      if (delayMs > 0) setTimeout(next, delayMs);
      else setTimeout(next, 0);
    }
    function playVerseRepeat(vNum: number) {
      if (!active) return;
      const key = `${cid}:${vNum}`;
      audioState.playVerse(key, chapterName);
      let ticks = 0;
      const waitStart = setInterval(() => {
        ticks++;
        if (ticks > 60) {
          clearInterval(waitStart);
          return;
        }
        if (audioState.currentVerseKey !== key) return;
        clearInterval(waitStart);
        const vt = audioState.verseTimings.find((t) => t.verseKey === key);
        if (vt) {
          watchInterval = setInterval(() => {
            if (!active) {
              clearInterval(watchInterval!);
              watchInterval = null;
              return;
            }
            if (audioState.currentTime * 1000 >= vt.timestampTo - 80) {
              clearInterval(watchInterval!);
              watchInterval = null;
              if (audioState.isPlaying) audioState.togglePlay();
              onVerseDone();
            }
          }, 50);
        } else {
          watchInterval = setInterval(() => {
            if (!active) {
              clearInterval(watchInterval!);
              watchInterval = null;
              return;
            }
            if (audioState.currentVerseKey !== key) {
              clearInterval(watchInterval!);
              watchInterval = null;
              if (audioState.isPlaying) audioState.togglePlay();
              onVerseDone();
            }
          }, 100);
        }
      }, 50);
    }
    playVerseRepeat(curVerse);
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label="Repeat settings"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="bg-base-100 rounded-2xl w-full max-w-sm shadow-xl"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="px-5 py-4 border-b border-base-200">
        <h2 class="font-semibold text-base">Repeat Settings</h2>
        <p class="text-xs text-base-content/50 mt-0.5">{chapterName}</p>
      </div>
      <div class="p-5 flex flex-col gap-4">
        <!-- Mode selector -->
        <div class="flex rounded-xl border border-base-300 overflow-hidden text-sm">
          {#each [{ v: 'single', label: 'Single Verse' }, { v: 'range', label: 'Verses Range' }, { v: 'chapter', label: 'Full Surah' }] as m (m.v)}
            <button
              class="flex-1 py-2 px-1 text-xs font-medium transition-colors {repeatMode === m.v
                ? 'bg-primary text-primary-content'
                : 'text-base-content/60 hover:bg-base-200'}"
              onclick={() => onRepeatModeChange(m.v)}>{m.label}</button
            >
          {/each}
        </div>
        <!-- Verse selector -->
        {#if repeatMode === 'single'}
          <div class="flex items-center justify-between">
            <span class="text-sm text-base-content/70">Verse</span>
            <input
              type="number"
              min="1"
              class="input input-bordered input-sm w-24 text-center"
              value={repeatFromVerse}
              oninput={(e) => {
                repeatFromVerse = Number((e.target as HTMLInputElement).value);
                repeatToVerse = repeatFromVerse;
              }}
            />
          </div>
        {:else if repeatMode === 'range'}
          <div class="flex items-center gap-3">
            <div class="flex-1 flex flex-col gap-1">
              <span class="text-xs text-base-content/50">From verse</span>
              <input
                type="number"
                min="1"
                class="input input-bordered input-sm w-full text-center"
                value={repeatFromVerse}
                oninput={(e) => (repeatFromVerse = Number((e.target as HTMLInputElement).value))}
              />
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <span class="text-xs text-base-content/50">To verse</span>
              <input
                type="number"
                min="1"
                class="input input-bordered input-sm w-full text-center"
                value={repeatToVerse}
                oninput={(e) => (repeatToVerse = Number((e.target as HTMLInputElement).value))}
              />
            </div>
          </div>
        {/if}
        <div class="border-t border-base-200"></div>
        {#if repeatMode !== 'single'}
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm text-base-content/70">Play range</span>
              <p class="text-[0.6rem] text-base-content/40">repeat the whole range N times</p>
            </div>
            <div class="flex items-center gap-2 w-32 justify-end">
              <button
                class="btn btn-ghost btn-xs btn-circle border border-base-300"
                onclick={decRepeatRange}
                disabled={repeatRange <= 1}>−</button
              >
              <span class="w-6 text-center text-sm font-semibold"
                >{repeatCountDisplay(repeatRange)}</span
              >
              <button
                class="btn btn-ghost btn-xs btn-circle border border-base-300"
                onclick={incRepeatRange}>+</button
              >
              <span class="text-xs text-base-content/40 w-8">times</span>
            </div>
          </div>
        {/if}
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm text-base-content/70">Repeat verse</span>
            <p class="text-[0.6rem] text-base-content/40">
              {repeatMode === 'single' ? 'total plays' : 'each verse per cycle'}
            </p>
          </div>
          <div class="flex items-center gap-2 w-32 justify-end">
            <button
              class="btn btn-ghost btn-xs btn-circle border border-base-300"
              onclick={decRepeatEachVerse}
              disabled={repeatEachVerse <= 1}>−</button
            >
            <span class="w-6 text-center text-sm font-semibold"
              >{repeatCountDisplay(repeatEachVerse)}</span
            >
            <button
              class="btn btn-ghost btn-xs btn-circle border border-base-300"
              onclick={incRepeatEachVerse}>+</button
            >
            <span class="text-xs text-base-content/40 w-8">times</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm text-base-content/70">Delay</span>
            <p class="text-[0.6rem] text-base-content/40">seconds between plays</p>
          </div>
          <div class="flex items-center gap-2 w-32 justify-end">
            <button
              class="btn btn-ghost btn-xs btn-circle border border-base-300"
              onclick={decRepeatDelay}
              disabled={repeatDelay <= 0}>−</button
            >
            <span class="w-6 text-center text-sm font-semibold">{repeatDelay}</span>
            <button
              class="btn btn-ghost btn-xs btn-circle border border-base-300"
              onclick={incRepeatDelay}>+</button
            >
            <span class="text-xs text-base-content/40 w-8">sec</span>
          </div>
        </div>
      </div>
      <div class="flex gap-2 px-5 pb-5">
        <button class="btn btn-ghost btn-sm flex-1" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary btn-sm flex-1" onclick={startRepeat}>Start Playing</button>
      </div>
    </div>
  </div>
{/if}
