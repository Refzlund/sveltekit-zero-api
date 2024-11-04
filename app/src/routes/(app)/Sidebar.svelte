<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">

	

</script>
<!---------------------------------------------------->


<nav>
	<div class='grid-flow-row'>
		<a class='selected'>Home</a>
		<section>
			<h4>Get Started</h4>
			<a>Install</a>
			<a>Configuration</a>
		</section>
		<section>
			<h4>Backend</h4>
			<a>Basics</a>
			<a>Functions</a>
			<a>Error handling</a>
		</section>
		<section>
			<h4>Frontend</h4>
			<a>Fetching</a>
			<a>Runes API</a>
			<a>Form API</a>
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
	
	nav {
		@apply grid grid-rows-[min-content,1fr,min-content] py-12
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