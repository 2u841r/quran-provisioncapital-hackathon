<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: any; form: any }>();

	const u = $derived(data.user);

	let deleteConfirm = $state(false);
	let avatarInput = $state<HTMLInputElement | null>(null);

	const displayImage = $derived(form?.imageUrl !== undefined ? form.imageUrl : u?.image);
</script>

<svelte:head>
	<title>My Profile — Quran</title>
</svelte:head>

<!-- Header navigation -->
<div class="sticky top-[3.5rem] z-20 bg-base-100 border-b border-base-200">
	<div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
		<a href="/" class="btn btn-ghost btn-sm btn-circle">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
			</svg>
		</a>
		<h1 class="text-base font-semibold text-base-content">My Profile</h1>
	</div>
</div>

<div class="max-w-2xl mx-auto px-4 py-6 space-y-6">

	<!-- ── Personalization ──────────────────────────────────────────────── -->
	<section class="space-y-4">
		<h2 class="text-sm font-semibold text-base-content uppercase tracking-wide">Personalization</h2>

		{#if form?.avatarError}
			<p class="text-xs text-white bg-error rounded-lg px-3 py-2">{form.avatarError}</p>
		{/if}

		<div class="flex items-center gap-5">
			<!-- Avatar -->
			<div class="relative shrink-0">
				{#if displayImage}
					<img src={displayImage} alt="Profile" class="w-16 h-16 rounded-full object-cover" />
				{:else}
					<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary select-none">
						{(u?.firstName || u?.name || u?.email || 'U').charAt(0).toUpperCase()}
					</div>
				{/if}
				<!-- Upload trigger overlay -->
				<button
					type="button"
					class="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
					onclick={() => avatarInput?.click()}
					aria-label="Change photo"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<circle cx="12" cy="13" r="3"/>
					</svg>
				</button>
			</div>

			<div class="flex flex-col gap-1.5">
				<p class="text-sm font-medium text-base-content">{u?.firstName && u?.lastName ? `${u.firstName} ${u.lastName}` : u?.name ?? ''}</p>
				<p class="text-xs text-base-content/50">{u?.email ?? ''}</p>

				<!-- Upload form (hidden input + submit on change) -->
				<form
					method="post"
					action="?/uploadAvatar"
					enctype="multipart/form-data"
					use:enhance
					id="avatar-upload-form"
				>
					<input
						bind:this={avatarInput}
						type="file"
						name="avatar"
						accept="image/jpeg,image/png,image/webp,image/gif"
						class="hidden"
						onchange={(e) => { (e.target as HTMLElement).closest('form')?.requestSubmit(); }}
					/>
				</form>

				<div class="flex items-center gap-2">
					<button
						type="button"
						class="btn btn-xs btn-ghost px-2"
						onclick={() => avatarInput?.click()}
					>
						{displayImage ? 'Change photo' : 'Upload photo'}
					</button>
					{#if displayImage}
						<form method="post" action="?/removeAvatar" use:enhance>
							<button type="submit" class="btn btn-xs btn-ghost text-error px-2">Remove</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<div class="divider my-2"></div>

	<!-- ── Edit Details ─────────────────────────────────────────────────── -->
	<section class="space-y-4">
		<h2 class="text-sm font-semibold text-base-content uppercase tracking-wide">Edit Details</h2>

		{#if form?.updateSuccess}
			<p class="text-sm text-success">Changes saved.</p>
		{/if}
		{#if form?.updateError}
			<p class="text-xs text-white bg-error rounded-lg px-3 py-2">{form.updateError}</p>
		{/if}

		<form method="post" action="?/updateProfile" use:enhance class="space-y-3">
			<!-- Email (read-only) -->
			<div class="form-control">
				<label class="label py-1" for="email">
					<span class="label-text text-xs font-medium text-base-content/60">Email</span>
				</label>
				<input
					id="email"
					type="email"
					value={u?.email ?? ''}
					disabled
					class="input input-bordered input-sm w-full bg-base-200 text-base-content/50 cursor-not-allowed"
				/>
			</div>

			<!-- Username (optional) -->
			<div class="form-control">
				<label class="label py-1" for="username">
					<span class="label-text text-xs font-medium text-base-content/60">Username <span class="opacity-50">(optional)</span></span>
				</label>
				<input
					id="username"
					name="username"
					type="text"
					value={u?.username ?? ''}
					placeholder="your_username"
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>

			<!-- First name -->
			<div class="form-control">
				<label class="label py-1" for="firstName">
					<span class="label-text text-xs font-medium text-base-content/60">First name</span>
				</label>
				<input
					id="firstName"
					name="firstName"
					type="text"
					value={u?.firstName ?? ''}
					placeholder="First name"
					required
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>

			<!-- Last name -->
			<div class="form-control">
				<label class="label py-1" for="lastName">
					<span class="label-text text-xs font-medium text-base-content/60">Last name</span>
				</label>
				<input
					id="lastName"
					name="lastName"
					type="text"
					value={u?.lastName ?? ''}
					placeholder="Last name"
					required
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>

			<button type="submit" class="btn btn-sm btn-accent mt-1">Save changes</button>
		</form>
	</section>

	<div class="divider my-2"></div>

	<!-- ── Change Password ──────────────────────────────────────────────── -->
	<section class="space-y-4">
		<h2 class="text-sm font-semibold text-base-content uppercase tracking-wide">Change Password</h2>

		{#if form?.passwordSuccess}
			<p class="text-sm text-success">Password updated.</p>
		{/if}
		{#if form?.passwordError}
			<p class="text-xs text-white bg-error rounded-lg px-3 py-2">{form.passwordError}</p>
		{/if}

		<form method="post" action="?/changePassword" use:enhance class="space-y-3">
			<div class="form-control">
				<label class="label py-1" for="currentPassword">
					<span class="label-text text-xs font-medium text-base-content/60">Current password</span>
				</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					placeholder="••••••••"
					required
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>
			<div class="form-control">
				<label class="label py-1" for="newPassword">
					<span class="label-text text-xs font-medium text-base-content/60">New password</span>
				</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					placeholder="••••••••"
					required
					minlength="8"
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>
			<div class="form-control">
				<label class="label py-1" for="confirmPassword">
					<span class="label-text text-xs font-medium text-base-content/60">Confirm new password</span>
				</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					placeholder="••••••••"
					required
					minlength="8"
					class="input input-bordered input-sm w-full bg-base-100 focus:border-success"
				/>
			</div>
			<button type="submit" class="btn btn-sm btn-accent mt-1">Update password</button>
		</form>
	</section>

	<div class="divider my-2"></div>

	<!-- ── Delete Account ───────────────────────────────────────────────── -->
	<section class="space-y-3">
		<p class="text-sm text-base-content/70">
			<span class="font-semibold text-base-content">Danger zone: </span>
			Deleting your account is permanent and cannot be undone. All your data will be removed.
		</p>

		{#if form?.deleteError}
			<p class="text-xs text-white bg-error rounded-lg px-3 py-2">{form.deleteError}</p>
		{/if}

		{#if !deleteConfirm}
			<button
				type="button"
				class="btn btn-sm btn-error btn-outline"
				onclick={() => (deleteConfirm = true)}
			>
				Delete account
			</button>
		{:else}
			<form method="post" action="?/deleteAccount" use:enhance class="space-y-3 p-4 rounded-xl border border-error/30 bg-error/5">
				<p class="text-sm font-medium text-error">Confirm deletion — enter your password:</p>
				<input
					name="password"
					type="password"
					autocomplete="current-password"
					placeholder="Your password"
					required
					class="input input-bordered input-sm w-full bg-base-100 border-error/40 focus:border-error"
				/>
				<div class="flex gap-2">
					<button type="submit" class="btn btn-sm btn-error">Yes, delete my account</button>
					<button type="button" class="btn btn-sm btn-ghost" onclick={() => (deleteConfirm = false)}>Cancel</button>
				</div>
			</form>
		{/if}
	</section>

</div>
