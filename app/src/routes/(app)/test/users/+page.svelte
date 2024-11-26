<script lang='ts'>
	import api from '$api'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import type { User } from '../../../api/users'


	let Form = formAPI<User>(api.users)
	let id = $state() as string | undefined

</script>
<!---------------------------------------------------->

<select bind:value={id} class='bg-gray-950 border-gray-800 rounded-md mb-4 text-primary'>
	{#await api.users.GET().$.OK(({body}) => body) then [users]}
		<option value={undefined}>None</option>
		{#each users! as user}
			<option value={user.id}>{user.name}</option>
		{/each}
	{/await}
</select>

<h3 class='text-xl md-2'>{$Form.name ? 'Updating ' + $Form.name : 'Create new user'}</h3>

<Form {id}>

	<label>Name<input name='name'></label>
	<label>E-mail<input name='email' type='email'></label>
	<label>Age<input name='age' type='number'></label>

	<button class='mt-4'>{id === undefined ? 'Create User' : 'Update User'}</button>

</Form>




<!---------------------------------------------------->
<style lang='postcss'>
	
	input {
		@apply mb-2;
	}

	button {
		@apply bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded;
	}

</style>