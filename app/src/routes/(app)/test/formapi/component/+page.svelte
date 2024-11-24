<script lang="ts">
	import Code from '$lib/Code/Code.svelte'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import api from '$lib/../api'
	import { tweened } from 'svelte/motion'

	interface Person {
		name: string
		age: number
		/** Significant other */
		so?: Person
		children?: Person[]
		pets: string[]
	}
	
	const UserForm = formAPI<Person>(api.formdata)
	// console.log($UserForm)
	let progress = tweened(0)
	$effect(() => {
		progress.set(UserForm.request.progress)
	})
</script>

<!---------------------------------------------------->

<bar
	style='--tw-gradient-from-position: {$progress*100}%; --tw-gradient-to-position: {$progress*100}%;'
	class='w-60 bg-green-400 h-4 bg-gradient-to-r to-white from-green-600 duration-150 rounded outline-gray-400 my-2'
></bar>

<UserForm class="mb-4">
	<button type="submit">Submit</button>
	<input name='name'>
</UserForm>

<Code
	code={{
		'result.json': JSON.stringify($UserForm, null, '    ')
	}}
/>

<div></div>

<!---------------------------------------------------->
<style lang="postcss">
</style>
