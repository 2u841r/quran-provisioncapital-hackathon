<script lang="ts">
	import type { Verse } from '$lib/types/quran';

	interface Props {
		verse: Verse;
		arabicText: string;
		open: boolean;
		onClose: () => void;
	}

	const { verse, arabicText, open, onClose }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let copied = $state<'' | 'link' | 'text'>('');

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function verseUrl(): string {
		const [c, v] = verse.verseKey.split(':');
		return `${typeof location !== 'undefined' ? location.origin : ''}/${c}/${v}`;
	}

	function shareText(): string {
		const trans = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '';
		return `${arabicText}\n${trans}\n— Quran ${verse.verseKey}`;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(verseUrl());
		copied = 'link';
		setTimeout(() => (copied = ''), 1500);
	}

	async function copyEmbed() {
		const embed = `<iframe src="${verseUrl()}" width="100%" height="200" frameborder="0"></iframe>`;
		await navigator.clipboard.writeText(embed);
		copied = 'text';
		setTimeout(() => (copied = ''), 1500);
	}
</script>

<dialog bind:this={dialog} class="share-modal modal" onclose={onClose}>
	<div class="modal-box share-box p-0">
		<!-- Sticky close -->
		<form method="dialog" class="absolute top-3 right-3 z-10">
			<button class="btn btn-ghost btn-sm btn-circle" aria-label="Close">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15" fill="currentColor">
					<path fill-rule="evenodd" d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5z" clip-rule="evenodd"/>
				</svg>
			</button>
		</form>

		<div class="p-6 pt-8">
			<h2 class="text-center text-xl font-semibold mb-4">Share the Quran!</h2>

			<div class="text-center text-sm text-base-content/70 space-y-1 mb-6">
				<p>The Prophet ﷺ said:</p>
				<p class="font-semibold text-base-content">'Convey from me, even if it is one verse.'</p>
				<p class="text-base-content/50 text-xs">(Bukhari 3461)</p>
			</div>

			<!-- Share grid -->
			<div class="grid grid-cols-3 gap-3">
				<a
					href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(verseUrl())}"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-1.5 text-xs"
				>
					<div class="w-12 h-12 rounded-full bg-base-content text-base-100 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.51h-2l-.396 3.98h2.396z"/></svg>
					</div>
					<span>Facebook</span>
				</a>

				<a
					href="https://twitter.com/intent/tweet?text={encodeURIComponent(shareText())}&url={encodeURIComponent(verseUrl())}"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-1.5 text-xs"
				>
					<div class="w-12 h-12 rounded-full bg-base-content text-base-100 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
					</div>
					<span>X</span>
				</a>

				<a
					href="https://wa.me/?text={encodeURIComponent(`${shareText()} ${verseUrl()}`)}"
					target="_blank"
					rel="noreferrer"
					class="flex flex-col items-center gap-1.5 text-xs"
				>
					<div class="w-12 h-12 rounded-full bg-base-content text-base-100 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.45A11.85 11.85 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.56 4.18 1.62 6L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.18-1.25-6.18-3.48-8.55zM12 21.83a9.83 9.83 0 0 1-5-1.36l-.36-.21-3.66.96.98-3.57-.24-.37A9.83 9.83 0 1 1 12 21.83zm5.39-7.36c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07a8.06 8.06 0 0 1-2.37-1.46 8.92 8.92 0 0 1-1.64-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.21 5.09 4.5.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>
					</div>
					<span>WhatsApp</span>
				</a>

				<button onclick={copyLink} class="flex flex-col items-center gap-1.5 text-xs">
					<div class="w-12 h-12 rounded-full bg-base-content text-base-100 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
						</svg>
					</div>
					<span>{copied === 'link' ? 'Copied!' : 'Copy link'}</span>
				</button>

				<button onclick={copyEmbed} class="flex flex-col items-center gap-1.5 text-xs">
					<div class="w-12 h-12 rounded-full bg-base-content text-base-100 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="16 18 22 12 16 6"/>
							<polyline points="8 6 2 12 8 18"/>
						</svg>
					</div>
					<span>{copied === 'text' ? 'Copied!' : 'Copy Embed'}</span>
				</button>
			</div>
		</div>
	</div>

	<form method="dialog" class="modal-backdrop">
		<button aria-label="Close">close</button>
	</form>
</dialog>

<style>
	/* Bottom sheet on mobile, centered card on desktop */
	.share-modal.modal {
		justify-items: center;
		align-items: flex-end;
	}
	.share-box {
		width: 100%;
		max-width: 100%;
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	@media (min-width: 1024px) {
		.share-modal.modal {
			align-items: center;
		}
		.share-box {
			max-width: 28rem;
			border-radius: 1rem;
		}
	}
</style>
