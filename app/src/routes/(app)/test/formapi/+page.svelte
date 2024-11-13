<script lang="ts">
	import Code from '$lib/Code/Code.svelte'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'

	interface Person {
		name: string
		age: number
		/** Significant other */
		so?: Person
		children?: Person[]
		pets: string[]
	}

	// * Endpoint
	const api = {
		users: {
			async GET() {
				return [] as Person[]
			},
			async POST(body: {  }) {
				return {} as Person
			}
		}
	}

	function runedAPI<T>(
		endpoint: {
			GET(): Promise<T[]>
		},
		discriminator: (body: any) => any
	) {

	}

	const users = runedAPI(api.users, body => body.id)

	const userForm = formAPI(api.users)

	</script>
<!---------------------------------------------------->

<form use:userForm class='mb-4'>

	<!-- <input name='name' /> -->
	<input placeholder="Name" use:userForm.$.name />
	<input name='name' placeholder="Name">
	
	<div contenteditable bind:innerText={$userForm.name}>Text</div>

	<!-- <input name='so.name' /> -->
	<input use:userForm.$.so.name placeholder="SO Name" />
	<input use:userForm.$.so.so.so.so.name placeholder='Deeply nested' />

	<div>
		<button
			type='button'
			onclick={() => ($userForm.children ??= [{} as Person]).push({} as Person)}
		>
			Add child
		</button>
		{#each $userForm.children ?? [] as _, i}
			{@const child = userForm.$.children[i]}
			<input aria-label='Child' use:child.name />
			<input name='children[{i}].name' />
		{/each}
	</div>
	<input use:userForm.$.pets[0] placeholder='Pets[0]' />
	<input name='pets[0]' placeholder='Pets[0]' />

</form>

<Code
	code={{
		'result.json': JSON.stringify($userForm, null, '    ')
	}}
/>

<div>

</div>



<!---------------------------------------------------->
<style lang='postcss'>
	
	

</style>