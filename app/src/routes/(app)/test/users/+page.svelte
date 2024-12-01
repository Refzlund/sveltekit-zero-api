<script lang='ts'>
	import api from '$api'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import type { User } from '../../../api/users'
	import type z from 'zod'

	let Form = formAPI<z.output<typeof User>>(api.users)

	let id = $state() as string | undefined

	$inspect($Form)

</script>
<!---------------------------------------------------->

<select bind:value={id} class='bg-gray-950 border-gray-800 rounded-md mb-4 text-primary'>
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