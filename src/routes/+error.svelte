<script lang="ts">
	import { goto } from '$app/navigation';

	function goBack() {
		if (typeof document !== 'undefined' && document.referrer) {
			history.back();
			return;
		}
		goto('/');
	}
</script>

<div class="flex w-full flex-col items-center px-4 pt-32 pb-16">
	<h1 class="mb-6 text-center text-4xl font-bold leading-normal">Sorry, something went wrong</h1>
	<div class="flex justify-center">
		<button class="btn btn-primary rounded-full px-8" onclick={goBack}>Go Back</button>
	</div>
</div>
