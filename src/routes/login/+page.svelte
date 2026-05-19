<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo_main.svg';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	const next = $derived($page.url.searchParams.get('next') ?? '/');
</script>

<svelte:head>
	<title>{mode === 'signin' ? 'Sign in' : 'Sign up'} — Quran</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center flex-col px-4 py-8 mx-auto w-full max-w-[370px] box-border">

	<!-- Header -->
	<div class="w-full flex flex-col items-center mb-8">
		<h1 class="text-xl font-normal text-base-content text-center leading-relaxed m-0">
			Your <span class="font-bold">Quran</span> Journey<br/>Starts Here
		</h1>
		<div class="flex flex-col items-center gap-1.5 mt-8 mb-5 w-full">
			<p class="text-xs text-base-content/70 text-center m-0 font-normal">
				{mode === 'signin' ? 'Sign in or create a new account' : 'Create your free account'}
			</p>
			<img src={logo} alt="Quran" class="h-[18px] w-auto mt-1" />
		</div>
	</div>

	<!-- Segmented tab switch -->
	<div class="w-full flex rounded-lg bg-base-200 p-0.5 mb-6">
		<button
			type="button"
			class="flex-1 py-2 text-sm font-medium rounded-md transition-all {mode === 'signin' ? 'bg-base-100 shadow text-base-content' : 'text-base-content/50 hover:text-base-content'}"
			onclick={() => (mode = 'signin')}
		>
			Sign in
		</button>
		<button
			type="button"
			class="flex-1 py-2 text-sm font-medium rounded-md transition-all {mode === 'signup' ? 'bg-base-100 shadow text-base-content' : 'text-base-content/50 hover:text-base-content'}"
			onclick={() => (mode = 'signup')}
		>
			Sign up
		</button>
	</div>

	<!-- Quran.com OAuth -->
	<a
		href="/auth/qf?next={next}"
		class="w-full flex items-center justify-center gap-2.5 h-11 rounded-full border border-base-300 bg-base-100 text-sm font-medium text-base-content hover:bg-base-200 transition-colors no-underline mb-4"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
		Sign in with Quran.com
	</a>

	<div class="flex items-center gap-3 w-full mb-4">
		<div class="flex-1 h-px bg-base-300"></div>
		<span class="text-xs text-base-content/40">or</span>
		<div class="flex-1 h-px bg-base-300"></div>
	</div>

	<!-- Form -->
	<form
		method="post"
		action={mode === 'signin' ? '?/signIn' : '?/signUp'}
		use:enhance
		class="w-full flex flex-col gap-3"
	>
		<input type="hidden" name="next" value={next} />

		{#if mode === 'signup'}
			<input
				name="name"
				type="text"
				autocomplete="name"
				placeholder="Your name"
				class="w-full h-12 px-4 rounded-lg border border-base-300 bg-base-100 text-base-content text-sm placeholder:text-base-content/30 outline-none transition-colors focus:border-success hover:border-success/50 box-border"
			/>
		{/if}

		<input
			name="email"
			type="email"
			autocomplete="email"
			placeholder="Email address"
			required
			class="w-full h-12 px-4 rounded-lg border border-base-300 bg-base-100 text-base-content text-sm placeholder:text-base-content/30 outline-none transition-colors focus:border-success hover:border-success/50 box-border"
		/>

		<div class="flex flex-col gap-1">
			<input
				name="password"
				type="password"
				autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
				placeholder="Password"
				required
				class="w-full h-12 px-4 rounded-lg border border-base-300 bg-base-100 text-base-content text-sm placeholder:text-base-content/30 outline-none transition-colors focus:border-success hover:border-success/50 box-border"
			/>
			{#if mode === 'signin'}
				<a
					href="/forgot-password"
					class="text-xs text-success font-bold self-end hover:opacity-75 transition-opacity"
				>
					Forgot password?
				</a>
			{/if}
		</div>

		{#if form?.message}
			<p class="text-xs text-white bg-error rounded-lg px-3 py-2">{form.message}</p>
		{/if}

		<button
			type="submit"
			class="w-full h-11 mt-1 rounded-full bg-success text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer border-none"
		>
			{mode === 'signin' ? 'Sign in' : 'Create account'}
		</button>
	</form>

	<!-- Privacy policy (sign-up only) -->
	{#if mode === 'signup'}
		<p class="text-center text-xs text-base-content/40 mt-4">
			By creating an account, you agree to our
			<a href="/privacy" class="hover:opacity-75 transition-opacity">Privacy Policy</a>
			and
			<a href="/terms" class="hover:opacity-75 transition-opacity">Terms of Service</a>.
		</p>
	{/if}

	<!-- Back button -->
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
