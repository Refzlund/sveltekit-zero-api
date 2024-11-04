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

</script>
<!---------------------------------------------------->


<app>
	<Header />
	<Sidebar />
	<content>
		{@render children?.()}
	</content>
</app>


<!---------------------------------------------------->
<style lang='postcss'>
	
	app {
		@apply
			grid grid-rows-[200px,1fr] grid-cols-[calc(15rem+6rem),1fr] 
			h-screen w-screen text-gray-300
		;
	}

	content {
		@apply max-h-full overflow-auto bg-gray-900;
	}

</style>