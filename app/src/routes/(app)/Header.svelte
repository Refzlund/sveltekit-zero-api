<!-- @component

	This is a description, \
	on how to use this.

@example
<Header />

-->

<script lang="ts">
	
	import Logo from '$lib/Logo.svelte'
	import Select from '$lib/Select'

</script>
<!---------------------------------------------------->


<header>

	<Logo class='scale-125 origin-left' />
	
	<span>
		Seamless TypeSafety === Better DX
	</span>
	
	<Select value='Documentation v2.0.0'>
		<Select.Option value='Documentation v2.0.0' />
		<Select.Option value='Documentation v0.15.8' />
	</Select>

	<circle id=a />
	<circle id=b />

</header>


<!---------------------------------------------------->
<style lang='postcss'>
	
	header {
		@apply 
			relative grid col-span-2 bg-gray-950 items-center 
			grid-cols-[1fr,4fr,1fr] px-24 overflow-hidden
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

	span {
		@apply text-2xl font-light italic text-gray-500 text-center;
	}

	circle {
		@apply absolute rounded-full w-[22rem] h-24 blur-[10rem];
		
		&#a { @apply bg-primary w-[42rem] -bottom-[13rem] left-[200px]; }
		&#b { @apply bg-secondary -bottom-[8rem] right-[250px]; }
	}

</style>