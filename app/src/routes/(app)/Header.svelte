<!-- @component

	Header for the site

@example
<Header />

-->

<script lang="ts">
	
	import Logo from '$lib/Logo.svelte'
	import Pill from '$lib/Pill.svelte'
	import Select from '$lib/Select'

	let documentationVersion = $state('2.0.0')

</script>
<!---------------------------------------------------->


<header>

	<Logo class='scale-125 origin-left' />

	<div>
		Seamless TypeSafety === Better DX
	</div>
	
	<Select bind:value={documentationVersion}>
		<Select.Option value='2.0.0'>
			{#snippet children(selected)}
				<span class:selected>
					Docs v2.0.0
					<Pill pink>Next</Pill>
				</span>
			{/snippet}
		</Select.Option>
		<Select.Option value='0.15.8'>
			{#snippet children(selected)}
				<span class:selected>
					Docs v0.15.8
					<Pill>Svelte 4</Pill>
				</span>
			{/snippet}
		</Select.Option>
	</Select>

	<circle id=a />
	<circle id=b />

</header>


<!---------------------------------------------------->
<style lang='postcss'>
	
	header {
		@apply 
			relative grid col-span-2 bg-gray-950 items-center 
			grid-cols-[230px,1fr,230px] px-24 overflow-hidden
		;

		&::after {
			content: '';
			background: radial-gradient(
				50% 50% at 50% 50%,
				theme('colors.gray.500') 0%,
				rgba(255,255,255,0) 110%
			);
			@apply absolute bottom-0 left-0 right-0 h-[2px] opacity-60;
		}
	}

	div {
		@apply text-2xl font-light italic text-gray-500 text-center;
	}

	span {
		@apply flex w-full justify-between items-center;
	}
	span.selected {
		@apply text-primary text-opacity-85 hover:text-opacity-100;
	}

	circle {
		@apply absolute rounded-full w-[22rem] h-24 blur-[10rem];
		
		&#a { @apply bg-primary w-[42rem] -bottom-[13rem] left-[200px]; }
		&#b { @apply bg-secondary -bottom-[8rem] right-[250px]; }
	}

</style>