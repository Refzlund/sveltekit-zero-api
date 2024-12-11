<script lang="ts">
	import api from '$api'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import type { User } from '$routes/api/users'
	import type z from 'zod'
	import { fromUrl, runesAPI, statefulAPI, getUrl, getMethod, objectProxy, getProxyModified } from 'sveltekit-zero-api/client'
	import { floatingUI } from '$lib/floating-ui.svelte'
	import { scale } from 'svelte/transition'

	let Form = formAPI<z.output<typeof User>>(api.users)

	let id = $state() as string | undefined

	let data = runesAPI({
		users: {
			api: api.users,
			discriminator: (body) => body.id,
			fetch: true,
			groups: {
				seniors: (v) => v.filter((v) => v.age > 50).sort((a, b) => a.age - b.age)
			}
		}
	})
	
	const user = data.users.create()
	
	// $inspect('modified', user.$.modified)
	// $inspect('item', user.$.item)
	// $inspect(user.$.isModified)

	

</script>

<!---------------------------------------------------->

<h3 class="text-xl md-2">
	{id ? 'Updating ' + $Form.name : 'Create new user'}
</h3>

<form onsubmit={e => {
	e.preventDefault()
	user.$.post()
}}>
	<label>
		Name
		<input name="name" bind:value={user.name} />
	</label>
	<label>
		E-mail
		<input name="email" type="email" bind:value={user.email} />
	</label>
	<label>
		Birth
		<input name="birth" type="date" bind:value={user.birth} />
	</label>
	<label>
		Age
		<input name="age" type="number" bind:value={user.age} />
	</label>

	<button class="mt-4 mr-4" disabled={!!Form.errors.length}
		>{id === undefined ? 'Create User' : 'Update User'}</button
	>
	<button type="reset">Reset</button>
</form>

<!---------------------------------------------------->
<style lang="postcss">
	input {
		@apply mb-2;
	}

	error {
		@apply block text-red-500;
	}

	button {
		@apply bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded;
	}
</style>
