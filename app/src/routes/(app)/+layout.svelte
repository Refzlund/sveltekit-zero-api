<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">

	import type { Snippet } from 'svelte'
	import Header from './Header.svelte'
	import Sidebar from './Sidebar.svelte'

	interface Props {
		children?: Snippet
	}

	let { children }: Props = $props()

	let clientWidth = $state(800)
	let mobile = $derived(clientWidth < 800)

</script>
<!---------------------------------------------------->

<svelte:body bind:clientWidth />

<app class:mobile>
	{#if !mobile}
		<Header />
	{/if}
	<Sidebar {mobile} />
	<content>
		{@render children?.()}
	</content>
</app>


<!---------------------------------------------------->
<style lang='postcss'>
	
	app {
		@apply
			grid grid-rows-[200px,1fr] grid-cols-[calc(15rem+6rem),1fr] 
			h-screen w-screen text-gray-300 bg-gray-900 overflow-hidden
		;

		&.mobile {
			@apply grid-rows-1 grid-cols-1;

			content {
				@apply ml-5;
			}
		}
	}

	content {
		@apply h-full w-full overflow-auto py-4 px-6;
	}

</style>