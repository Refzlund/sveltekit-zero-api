<script module lang='ts'>
	import { npmjs, github } from '$lib/fetch'
	import { browser } from '$app/environment'

	let npmjsData: Promise<any> | undefined, githubData: Promise<any> | undefined

	if(browser) {
		npmjsData = npmjs()
		githubData = github()
	}

</script>

<div class='flex items-center justify-between'>
	<a
		class='flex items-center'
		aria-label='SvelteKit-zero-api GitHub'
		href='https://github.com/Refzlund/sveltekit-zero-api'
		target='_blank'
	>
		<icon class='size-6 iconify devicon--github'></icon>
		{#if githubData}
			{#await githubData then data}
				<span class='pl-2.5 text-sm text-gray-400'>{data.stargazers_count} ★</span>
			{/await}
		{/if}
	</a>
	<a
		class='flex items-center'
		aria-label='SvelteKit-zero-api NPM JS'
		href='https://www.npmjs.com/package/sveltekit-zero-api'
		target='_blank'
	>
		{#if npmjsData}
			{#await npmjsData then data}
				<span class='pr-2.5 text-sm text-gray-400'>↓ {data.downloads}/mo</span>
			{/await}
		{/if}
		<icon class='size-6 iconify-color devicon--npm'></icon>
	</a>
</div>