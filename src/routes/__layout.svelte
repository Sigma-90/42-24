<script>
	import { navigating } from '$app/stores';
	import { actionIsPending } from '$lib/utils/stores';
	import Spinner from '$lib/components/spinner.svelte';
	import IntroHeader from '$lib/components/introHeader.svelte';
	import '../app.css';
</script>

<IntroHeader />
<main class="mx-auto max-w-6xl p-6">
	<slot />
</main>
<footer class="text-center">&copy; 2022</footer>
<Spinner show={!!$navigating || !!$actionIsPending} background="space" appearance="wormhole" />

<style>
	main {
		min-height: calc(100vh - 4.375rem - 2rem);
	}
	footer {
		height: 2rem;
		background-color: #fff;
		line-height: 2rem;
		font-size: 1rem;
	}
</style>
