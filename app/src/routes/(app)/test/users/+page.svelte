<script lang='ts'>
	import api from '$api'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import type { User } from '../../../api/users'
	import type z from 'zod'
	import { statefulAPI } from 'sveltekit-zero-api/client'
	import { floatingUI } from '$lib/floating-ui.svelte'

	let Form = formAPI<z.output<typeof User>>(api.users)

	let id = $state() as string | undefined

	let search = statefulAPI(
		(name: string) => api.users.search(name),
		{ cooldown: 500 }
	)

	const searchFloat = floatingUI({})

</script>
<!---------------------------------------------------->

<div class='flex gap-2 items-center mb-8'>
	<input use:searchFloat.ref bind:value={search.args[0]} class='!m-0 w-56' type='search' placeholder="Search users">
	{#if search.args[0] && search.result}
		<div use:searchFloat class='bg-gray-950 z-50 rounded flex flex-col gap-2 p-1 w-56 max-h-80 overflow-y-auto'>
			{#each search.result as user}
				<button class='!bg-transparent hover:!bg-gray-900 ' onclick={() => { id = user.id; search.result = undefined; search.args[0] = '' }}>{user.name}</button>
			{/each}
		</div>
	{/if}

	<select bind:value={id} class='bg-gray-950 border-gray-800 rounded-md m-0 text-primary'>
		<option value={undefined}>None</option>
		{#await api.users.GET().$.OK(({body}) => body).serverError(({body}) => body) then [users, error]}
			{#if users}
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			{:else if error}
				Could not load users: {JSON.stringify(error)}
			{/if}
		{/await}
	</select>
</div>

<h3 class='text-xl md-2'>{id ? 'Updating ' + $Form.name : 'Create new user'}</h3>

<Form {id}>

	<label>
		Name
		<input required name='name'>
		<error hidden={!Form.errors.name?.code}>{Form.errors.name?.error}</error>
	</label>
	<label>
		E-mail
		<input name='email' type='email'>
		<error hidden={!Form.errors.email?.code}>{Form.errors.email?.error}</error>
	</label>
	<label>
		Birth
		<input name='birth' type='date'>
		<error hidden={!Form.errors.birth?.code}>{Form.errors.birth?.error}</error>
	</label>
	<label>
		Age
		<input name='age' type='number'>
		<error hidden={!Form.errors.age?.code}>{Form.errors.age?.error}</error>
	</label>

	<error hidden={!Form.error.code}>
		{Form.error.error}
	</error>

	<button class='mt-4 mr-4' disabled={!!Form.error.count}>{id === undefined ? 'Create User' : 'Update User'}</button>
	<button type='reset'>Reset</button>
</Form>




<!---------------------------------------------------->
<style lang='postcss'>
	
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