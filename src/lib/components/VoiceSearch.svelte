<script lang="ts">
	interface Props {
		onTranscript: (text: string) => void;
		class?: string;
	}

	const { onTranscript, class: className = '' }: Props = $props();

	let active = $state(false);
	let supported = $state(true);
	let errorMsg = $state('');
	let recognition: any = null;

	type AnyWindow = Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };

	// Check support on mount (client only)
	$effect(() => {
		if (typeof window !== 'undefined') {
			const w = window as AnyWindow;
			supported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
		}
	});

	function cleanTranscript(t: string): string {
		// Strip LTR/RTL Unicode marks that Arabic speech API may inject
		return t.replace(/[‎‏‪-‮]/g, '').trim();
	}

	function stop() {
		try { recognition?.stop(); } catch {}
		recognition = null;
		active = false;
	}

	function start() {
		errorMsg = '';
		const w = window as AnyWindow;
		const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
		if (!SR) { supported = false; return; }

		recognition = new SR();
		recognition.lang = 'ar';
		recognition.interimResults = true;
		recognition.continuous = false;

		recognition.onresult = (e: any) => {
			const last = e.results[e.results.length - 1];
			const transcript = cleanTranscript(last[0].transcript);
			if (transcript) onTranscript(transcript);
		};

		recognition.onend = () => {
			// Restart only if still active (continuous feel while mic is on)
			if (active) {
				try { recognition?.start(); } catch { active = false; }
			}
		};

		recognition.onerror = (e: any) => {
			const code: string = e.error ?? '';
			if (code === 'not-allowed' || code === 'service-not-allowed') {
				errorMsg = 'Microphone access denied.';
			} else if (code === 'network') {
				errorMsg = 'Network error. If using Brave, try disabling shields.';
			} else if (code === 'no-speech') {
				errorMsg = '';
			} else if (code !== 'aborted') {
				errorMsg = 'Voice search unavailable.';
			}
			stop();
		};

		try {
			recognition.start();
			active = true;
		} catch {
			active = false;
		}
	}

	function toggle() {
		if (active) { stop(); } else { start(); }
	}
</script>

{#if supported}
	<div class="relative {className}">
		<button
			type="button"
			onclick={toggle}
			class="btn btn-ghost btn-sm btn-circle transition-colors {active ? 'text-error' : 'text-base-content/50 hover:text-base-content'}"
			aria-label={active ? 'Stop voice search' : 'Start voice search'}
			title={active ? 'Stop voice search' : 'Search by voice'}
		>
			{#if active}
				<!-- Mic active: filled + pulse ring -->
				<span class="relative flex items-center justify-center">
					<span class="absolute inline-flex h-full w-full rounded-full bg-error/30 animate-ping"></span>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12.304 14.946a3.573 3.573 0 0 0 3.558-3.566V3.566A3.573 3.573 0 0 0 12.304 0a3.573 3.573 0 0 0-3.56 3.566v7.814a3.573 3.573 0 0 0 3.56 3.566m6.286-3.915c0 3.566-3.024 6.062-6.286 6.062-3.263 0-6.287-2.496-6.287-6.062H4c0 4.041 3.203 7.429 7.117 7.964v4.255h2.373v-4.255c3.914-.594 7.117-3.923 7.117-7.964z"/>
					</svg>
				</span>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12.304 14.946a3.573 3.573 0 0 0 3.558-3.566V3.566A3.573 3.573 0 0 0 12.304 0a3.573 3.573 0 0 0-3.56 3.566v7.814a3.573 3.573 0 0 0 3.56 3.566m6.286-3.915c0 3.566-3.024 6.062-6.286 6.062-3.263 0-6.287-2.496-6.287-6.062H4c0 4.041 3.203 7.429 7.117 7.964v4.255h2.373v-4.255c3.914-.594 7.117-3.923 7.117-7.964z"/>
				</svg>
			{/if}
		</button>

		{#if errorMsg}
			<div class="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs text-base-content/80 shadow-lg">
				{errorMsg}
			</div>
		{/if}
	</div>
{/if}
