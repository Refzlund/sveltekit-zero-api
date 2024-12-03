<script lang='ts'>
	import api from '$api'
	import { formAPI } from 'sveltekit-zero-api/formapi.svelte'
	import type { User } from '../../../api/users'
	import type z from 'zod'
	import { runesAPI, statefulAPI } from 'sveltekit-zero-api/client'
	import { floatingUI } from '$lib/floating-ui.svelte'
	import { scale } from 'svelte/transition'

	let Form = formAPI<z.output<typeof User>>(api.users)

	let id = $state() as string | undefined

	let search = statefulAPI(
		(name: string) => name ? api.users.search(name) : undefined,
		{ warmup: 500 }
	)

	const searchFloat = floatingUI({})
	
	let data = runesAPI({
		users: {
			api: api.users,
			discriminator: body => body.id,
			groups: {
				seniors: (v) => v.filter(v => v.age > 50).sort((a,b) => a.age - b.age)
			}
		},
		articles: {
			api: api.articles,
			discriminator: body => body.id
		}
	})

	data.articles.get()
	let post = data.articles.post({
		id: 'Article:5',
		title: 'Title',
		content: 'Content'
	})
	if('errors' in post) {
		console.error(post.errors)
	}
	else {
		post.success(() => console.log('Article created!'))
	}
	
	data.users.groups.seniors

	

	data.users.test

	const a1 = data.articles.modify('Article:0')
	a1.$.patch()
	a1.$.isModified
	a1.$.validate()
	a1.$.validate('nested.name')

	const a2 = data.articles.create()

	data.articles.list
	

	const paginator = new data.articles.Paginator(10)
	paginator.current
	paginator.list
	paginator.total
	paginator.next()
	paginator.prev()


</script>
<!---------------------------------------------------->

<div class='flex gap-2 items-center mb-8 relative'>
	{#if search.isLoading && search.args[0]}
		<loading transition:scale class='top-1/2 -translate-y-1/2 -left-6 absolute'> <icon class='animate-spin iconify fluent--spinner-ios-20-filled'></icon> </loading>
	{/if}
	<input use:searchFloat.ref bind:value={search.args[0]} class='!m-0 w-56' type='search' placeholder="Search users">
	{#if search.args[0] && search.result}
		<div use:searchFloat class='bg-gray-950 z-50 rounded flex flex-col gap-2 p-1 w-56 max-h-80 overflow-y-auto'>
			{#each search.result as user}
				<button class='!bg-transparent hover:!bg-gray-900 ' onclick={() => { id = user.id; search.result = undefined; search.args[0] = '' }}>{user.name}</button>
			{/each}
		</div>
	{/if}

	<!-- <select bind:value={id} class='bg-gray-950 border-gray-800 rounded-md m-0 text-primary'>
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
	</select> -->
	<select bind:value={id} class='bg-gray-950 border-gray-800 rounded-md m-0 text-primary'>
		<option value={undefined}>None</option>
		{#each data.users.list as user}
			<option value={user.id}>{user.name}</option>
		{/each}
	</select>
</div>

<h3 class='text-xl md-2'>{id ? 'Updating ' + $Form.name : 'Create new user'}</h3>

<Form {id}>

	<label>
		Name
		<input required name='name'>
		<!-- Better syntax? -->
		<!-- Yes; an array of errors based on a path. Solves unncessary complexity. -->
		<!-- {#each Form.errors('name') as { code, error }}
			<error>{error}</error>
		{/each} -->
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