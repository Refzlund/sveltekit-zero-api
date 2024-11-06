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
	import type { LayoutData } from './$types'

	interface Props {
		children?: Snippet
		data: LayoutData
	}

	let { children, data }: Props = $props()

	let clientWidth = $state(data.mobile ? 425 : 800)
	let mobile = $derived(clientWidth < 800)

</script>
<!---------------------------------------------------->

<svelte:body bind:clientWidth />

<app class:mobile>
	{#if !mobile}
		<Header />
	{/if}
	<Sidebar {mobile} />
	<page>
		{#if !mobile}
			<centered>
				{@render children?.()}
			</centered>
		{:else}
			{@render children?.()}
		{/if}
	</page>
</app>


<!---------------------------------------------------->
<style lang='postcss'>
	
	app {
		@apply
			grid grid-rows-[200px,1fr] grid-cols-[calc(15rem+6rem),1fr] 
			h-screen w-screen text-gray-300 bg-gray-900 overflow-hidden
		;

		page {
			@apply grid justify-center h-full w-full overflow-auto py-4 px-6;
		}

		centered {
			@apply block max-w-2xl py-8;
		}

		&.mobile {
			@apply grid-rows-1 grid-cols-1;

			page {
				@apply block ml-5 p-7;
			}
		}
	}

	

	

</style>