<script lang='ts'>

	import { npmjs, github } from '$lib/fetch'
	
</script>

<div class='flex items-center justify-between'>
	<a
		class='flex items-center'
		aria-label='SvelteKit-zero-api GitHub'
		href='https://github.com/Refzlund/sveltekit-zero-api'
	>
		<icon class='size-6 iconify devicon--github'></icon>
		{#await github() then data}
			<span class='pl-2.5 text-sm text-gray-400'>{data.stargazers_count} ★</span>
		{/await}
	</a>
	<a
		class='flex items-center'
		aria-label='SvelteKit-zero-api NPM JS'
		href='https://www.npmjs.com/package/sveltekit-zero-api'
	>
		{#await npmjs() then data}
			<span class='pr-2.5 text-sm text-gray-400'>↓ {data.downloads}/mo</span>
		{/await}
		<icon class='size-6 iconify-color devicon--npm'></icon>
	</a>
</div>