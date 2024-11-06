<!-- @component

	Navbar for the site

@example
<Sidebar mobile={false} />

-->

<script lang="ts">
	import { drag } from '$lib/drag.svelte'
	import { floatingUI } from '$lib/floating-ui.svelte'
	import Logo from '$lib/Logo.svelte'
	import Stats from './Stats.svelte'

	let float = floatingUI({
		placement: 'left',
	})

	interface Props {
		mobile: boolean
	}
	
	let {
		mobile
	}: Props = $props()
	
	let navdrag = drag({ maxX: 0 })
	
	let clientWidth = $state(0)
	$effect.pre(() => {
		navdrag.minX = -clientWidth + 25
	})

</script>
<!---------------------------------------------------->

{#snippet navitem(text: string, href: string = '/', selected = false)}
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

<nav 
	bind:clientWidth 
	class:moving={navdrag.moving} 
	class:mobile 
	style={mobile ? `transform: translateX(${navdrag.x}px)` : ''}
>
	<div>
		{#if mobile}
			<handle use:navdrag.action>
				<icon class='iconify fluent--re-order-20-regular pointer-events-none'></icon>
			</handle>

			<header>
				<Stats />
				<Logo class='justify-self-center scale-125 py-6' />
			</header>
		{/if}
		<div class='grid-flow-row' onmouseleave={() => float.untether()} role='navigation'>
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
		{#if !mobile}
			<span></span>
			<div class='mt-8'><Stats /></div>
		{/if}
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
		@apply relative overflow-hidden
			bg-gray-950 border-r border-gray-800 border-opacity-85;

		transition: transform 300ms ease-in-out;
		
		> div {
			@apply grid grid-rows-[min-content,1fr,min-content] py-12 overflow-auto h-full;
		}

		> div > div {
			@apply grid px-12;
		}

		&.moving {
			@apply duration-0;
		}
	}

	nav.mobile {
		@apply 
			absolute top-0 bottom-0 left-0 right-[8vw]
			rounded-tr-3xl rounded-br-3xl 
		;

		> div {
			@apply grid-rows-[min-content,min-content,1fr,min-content] py-[8vw];
		}

		> div > div {
			@apply px-[calc(8vw)];
		}

		> div > header {
			@apply px-[calc(8vw)] grid grid-flow-row gap-3 w-full;
		}
	}

	handle {
		@apply flex absolute top-0 bottom-0 right-0 items-center w-10 justify-end;
		icon {
			@apply rotate-90 size-6 text-gray-600;
		}
	}

	a {
		@apply flex h-10 items-center cursor-pointer;
		&.selected {
			@apply text-primary cursor-default;
		}
	}

	section {
		@apply grid grid-flow-row py-1.5 items-center mb-4 last:mb-0;

		> h4 {
			@apply uppercase text-sm text-gray-500 pb-2 cursor-default;
		}

		> a {
			@apply text-gray-400 border-l border-gray-800 pl-4;
		}
	}

</style>