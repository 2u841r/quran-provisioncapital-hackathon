<script lang="ts">
	import { page } from '$app/stores';

	const next = $derived($page.url.searchParams.get('next') ?? '/');
	const error = $derived($page.url.searchParams.get('error'));

	const ERROR_MESSAGES: Record<string, string> = {
		qf_not_configured: 'Quran.com login is not configured.',
		token_exchange_failed: 'Login failed. Please try again.',
		state_mismatch: 'Login failed: invalid state. Please try again.',
		missing_params: 'Login failed: missing parameters. Please try again.',
		invalid_id_token: 'Login failed: invalid token. Please try again.',
	};
</script>

<svelte:head>
	<title>Sign in — Quran</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center flex-col px-4 py-8 mx-auto w-full max-w-[370px] box-border">

	<div class="w-full flex flex-col items-center mb-8">
		<h1 class="text-xl font-normal text-base-content text-center leading-relaxed m-0">
			Your <span class="font-bold">Quran</span> Journey<br/>Starts Here
		</h1>
		<div class="flex flex-col items-center gap-1.5 mt-8 mb-5 w-full">
			<p class="text-xs text-base-content/70 text-center m-0 font-normal">Sign in to sync your progress</p>
			<span style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.3rem; letter-spacing: -0.01em;" class="text-base-content mt-1">Quran.bid</span>
		</div>
	</div>

	{#if error}
		<p class="text-xs text-white bg-error rounded-lg px-3 py-2 w-full mb-4 text-center">
			{ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
		</p>
	{/if}

	<a
		href="/auth/qf?next={next}"
		class="w-full flex items-center justify-center gap-2.5 h-11 rounded-full border border-base-300 bg-base-100 text-sm font-medium text-base-content hover:bg-base-200 transition-colors no-underline"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
		Sign in with Quran.com
	</a>

	<button
		type="button"
		class="flex items-center gap-1.5 mt-6 text-sm text-base-content/70 hover:opacity-75 transition-opacity bg-transparent border-none cursor-pointer"
		onclick={() => history.back()}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
		</svg>
		Back
	</button>
</div>
