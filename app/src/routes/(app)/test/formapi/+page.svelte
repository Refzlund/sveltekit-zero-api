<script lang="ts">
	import Code from '$lib/Code/Code.svelte'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import api from '$lib/../api'

	interface Person {
		name: string
		age: number
		/** Significant other */
		so?: Person
		children?: Person[]
		pets: string[]
	}

	function createFormDataWithAllTypes() {
		const formData = new FormData()

		// Text data
		formData.append('text', 'Sample text value')
		formData.append('number', 42) // Numbers are treated as strings

		// File data (mock file for example purposes)
		const mockFile = new File(['Hello, world!'], 'example.txt', { type: 'text/plain' })
		formData.append('file', mockFile)

		// Blob data
		const blob = new Blob(['Blob content'], { type: 'text/plain' })
		formData.append('blob', blob, 'blobExample.txt')

		// JSON data
		const jsonData = { name: 'Arthur', age: 25 }
		formData.append('json', JSON.stringify(jsonData))

		// Array data
		const arrayData = ['reading', 'coding', 'gaming']
		formData.append('array', JSON.stringify(arrayData))

		// Boolean value (stored as string)
		formData.append('boolean', String(true))

		// Checkbox-like values
		formData.append('isSubscribed', 'true')

		// Complex object as stringified JSON
		const complexObject = {
			id: 123,
			attributes: { height: 180, weight: 75 },
			preferences: ['music', 'travel', 'food'],
		}
		formData.append('complexObject', JSON.stringify(complexObject))

		// Multiple values for the same key (e.g., multiple files)
		const file1 = new File(['File 1 content'], 'file1.txt', { type: 'text/plain' })
		const file2 = new File(['File 2 content'], 'file2.txt', { type: 'text/plain' })
		formData.append('multiFile', file1)
		formData.append('multiFile', file2)

		return formData
	}

	function onsubmit() {
		let data = new FormData(userForm.form)
		
		api.formdata.POST.xhr(data)
			.uploadProgress(e => console.log('progress', e.loaded / e.total))
			.any(res => console.log({ body: res.body }))
	}

	// @ts-ignore
	const userForm = formAPI<Person>()
</script>

<!---------------------------------------------------->

<button onclick={onsubmit}>Submit</button>

<form use:userForm class="mb-4">
	<!-- <input name='name' /> -->
	<input placeholder="Name" use:userForm.$.name />
	<input name="name" placeholder="Name" />
	<div contenteditable bind:innerText={$userForm.name}>Text</div>

	<div class='flex flex-col p-2 gap-2'>
		<input type='file' name='file'>
		<input type='search'>
	</div>

	

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
