<script lang="ts">

	import '../app.pcss'

	let { children } = $props()

</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin='anonymous'>
</svelte:head>

<site>
	{@render children()}
</site>

<style lang='postcss'>
	
	@import 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap';

	site {
		@apply block w-screen h-screen overflow-auto;
	}

	:global html {
		font-family: Inter, Arial, Helvetica, sans-serif;
		font-size: 18px;
	}

</style>