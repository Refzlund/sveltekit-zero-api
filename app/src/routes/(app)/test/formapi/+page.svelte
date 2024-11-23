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
	
	const userForm = formAPI<Person>(api.formdata)
	let progress = tweened(0)
	$effect(() => {
		progress.set(userForm.request.progress)
	})
</script>

<!---------------------------------------------------->

<bar
	style='--tw-gradient-from-position: {$progress*100}%; --tw-gradient-to-position: {$progress*100}%;'
	class='w-60 bg-green-400 h-4 bg-gradient-to-r to-white from-green-600 duration-150 rounded outline-gray-400 my-2'
></bar>

<form use:userForm class="mb-4">
	<button type="submit">Submit</button>

	<!-- <input name='name' /> -->
	<input placeholder="Name" use:userForm.$.name />
	<input name="name" placeholder="Name" />

	<input type='hidden' name='hidden'>
	<div contenteditable bind:innerText={$userForm.hidden}>Text</div>

	<input name='value' placeholder='With value' value='Predefined value'>

	<input type='file' name='file'>

	

	<!-- <input name='so.name' /> -->
	<input name='so.name' placeholder="SO Name" />
	<input name='so.so.so.so.name' placeholder="Deeply nested" />

	<div>
		<button type="button" onclick={() => ($userForm.children ??= [{} as Person]).push({} as Person)}>
			Add child
		</button>
		{#each $userForm.children ?? [] as _, i}
			{@const child = userForm.$.children[i]}
			<input aria-label="Child" use:child.name />
			<input name="children[{i}].name" />
		{/each}
	</div>
	<input use:userForm.$.pets[0] placeholder="Pets[0]" />
	<input name="pets[0]" placeholder="Pets[0]" />
</form>

<Code
	code={{
		'result.json': JSON.stringify($userForm, null, '    ')
	}}
/>

<div></div>

<!---------------------------------------------------->
<style lang="postcss">
</style>
