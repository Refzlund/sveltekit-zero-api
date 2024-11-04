<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">
	import { floatingUI } from '$lib/floating-ui.svelte'

	let float = floatingUI({
		placement: 'left',
	})

</script>
<!---------------------------------------------------->

{#snippet navitem(text: string, href: string = '', selected = false)}
	{#if selected}
		<a {href} class:selected use:float.ref onmouseenter={() => float.untether()}>
			{text}
		</a>
	{:else}
		<a {href} onmouseenter={(e) => float.tether(e.target as HTMLElement)}>
			{text}
		</a>
	{/if}
{/snippet}

<nav>
	<div class='grid-flow-row' onmouseleave={() => float.untether()}>
		<cursor use:float></cursor>
		{@render navitem('Home', '/', true)}
		<section>
			<h4>Get Started</h4>
			{@render navitem('Install')}
			{@render navitem('Configuration')}
		</section>
		<section>
			<h4>Backend</h4>
			{@render navitem('Basics')}
			{@render navitem('Functions')}
			{@render navitem('Error handling')}
		</section>
		<section>
			<h4>Frontend</h4>
			{@render navitem('Fetching')}
			{@render navitem('Runes API')}
			{@render navitem('Form API')}
		</section>
	</div>
	<span></span>
	<div>
		<div class='grid grid-cols-[repeat(2,min-content)] gap-3'>
			<a
				class='size-6 iconify devicon--github'
				aria-label='SvelteKit-zero-api GitHub'
				href='https://github.com/Refzlund/sveltekit-zero-api'
			></a>
			<a
				class='size-6 iconify-color devicon--npm'
				aria-label='SvelteKit-zero-api NPM JS'
				href='https://www.npmjs.com/package/sveltekit-zero-api'
			></a>
		</div>
	</div>
</nav>


<!---------------------------------------------------->
<style lang='postcss'>

	cursor {
		@apply absolute left-12 w-[2px] translate-x-[1px] h-10 duration-300 fluent--bring-to-front-20-regular bg-primary;

		mix-blend-mode: soft-light;
		backdrop-filter: brightness(2);
	}
	
	nav {
		@apply relative grid grid-rows-[min-content,1fr,min-content] py-12
			bg-gray-950 border-r border-gray-800 border-opacity-85;
		
		> div {
			@apply grid px-12;
		}
	}

	a {
		@apply flex h-10 items-center cursor-pointer;
		&.selected {
			@apply text-primary cursor-default;
		}
	}

	section {
		@apply grid grid-flow-row py-1.5 items-center mb-4;

		> h4 {
			@apply uppercase text-sm text-gray-500 pb-2 cursor-default;
		}

		> a {
			@apply text-gray-400 border-l border-gray-800 pl-4;
		}
	}

</style>