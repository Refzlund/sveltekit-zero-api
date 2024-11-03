# SvelteKit-zero-API 2.0.0

note: These are my own notes for. Not intended to be read, as its not very formal🦒

To match Svelte 5's ground-up rewrite, this too will be a complete rewrite of SvelteKit-Zero-API where I take everything I've learned the past years, and apply them to a magical library.

I was going to do this at some point. Now with [Svelte Hackathon 2024](https://hack.sveltesociety.dev/2024/prizes) here, it is no better time that now!

In Version 2, I'm introducing a lot more client code for managing data. REALLY making it feel like a zero API library. Originally (a year ago), I was planning to manage these using stores. Let's throw that out the window and use actual Nordic magic; runes.

As taught my AWS-CDK team on their Twitch.tv, I am starting with creating an idea of the usage of the library first. And then I'll try to make that a reality. Not everything might be possible, but this gives me a solid aim and core-foundation for the library and its functionality.

Last year at New Years Eve, I was actually programming on SvelteKit Zero API as the fireworks went on outside.

I'm planning for those fireworks to low-key celebrate SvelteKit-Zero-API Version 2, as I am setting my deadline to be a week prior to the Svelte Hackathon 2024, so I can catch any hanging bugs before final submission.8

The Hackathon is a motivator, but not a driver. This was going to come whether I wanted it or not🕺

## Endpoints, runedAPI and formAPI

```svelte

<script lang='ts'>
	// use runes

	import { api } from '$lib'
	import { runedAPI, formAPI, url, requestInit } from 'sveltekit-zero-api'
	
	import relative from './$api' // ? Is this possible?
	// SvelteKit API relative to current folder (if possible) 
	relative.GET() 
	relative._.GET() // previous route?
	// or something along the lines of
	import { api, relative } from '$lib'
	relative<import('./$type').API>().GET()

	/*
		api/users GET returns User[]
		api/users POST returns User
		api/users/[id] GET returns User
		api/users/[id] PUT returns User
		api/users/[id] DELETE returns OK/BadRequest
	*/
	
	const users = runedAPI(
		// discriminator
		body => body.id,
		// api endpoint
		api.users
	)

	// /api/users
	console.log(url(api.users))

	// { body: '{ "name": "Shiba" }' }
	console.log(requestInit(api.users.POST({ name: 'Shiba' })))

	// if not exist, GET api/users[id]
	users['User:1']?.name
	let user1 = users['User:1'] // reactive (of course)

	users.POST({ name: 'hey' })
	// support array POSTs
	users.POST([{ name: 'Giraffe' }, { name: 'Shiba' }])

	users.PUT('User:1', { name: 'new name' }, {
		/**
			@default false
			Update local-key first (if exists), and revert if response errors 
		*/
		update: true 
	})

	users.GET({
		...queryParams, 
		// some logic to handle pagination?
		from: users.pagination
	})
	users.GET('User:1')

	users.POST({...}).$.OK(...) // ability to use api as normal

	users.DELETE('User:1')

	/*
		All these methods (POST, PUT, GET, DELETE) etc.
		are only available if the endpoints are available.
		This may be automatically checked and typed.	
	*/

	// * FormAPI
	const userForm = formAPI(api.users)
	// or
	const userForm = formAPI(users) // use runedAPI to update runes-list


	function iLoveShiba() {
		// gets called
	}

	// * Work well with Promises resolve/reject (reject on .error)
	const [promise, body] = users.GET().$.promise.success(r => r.body)
	const promise = users.GET().promise
	toast(promise, 'loading', 'success', 'error')

	// or just make a toaster that supports the SvelteKit-zero-API fetch call
	const [body] = toast(
		users.GET(), 
		'loading', 'success', 'error'
	).$.success(r => r.body)

</script>

{#if users['User:1']}
	User:1's name is <input bind:value={users['User:1'].name}>
	and <input bind:value={user1.name}>
	
	This is reactive:
	{users['User:1'].name}
	
	To User:1's name in this list:
{/if}
{#each users.list as user}
	{user.id}: {user.name}
{/if}

<!-- POST to endpoint -->
<form 
	use:userForm={{ 
		enhance: true, // @default true — SvelteKit use:enhance
		id: 'User:1' // if ID provided, do GET/PUT, otherwise POST
	}}
>
	<input name='name' />
	or use: allowing us to provide client validation
	todo: how to define validation ONCE for endpoints
	<input use:userForm.name />
	<!-- error handling -->
	<span hidden={!userForm.errors.name}>
		{userForm.errors.name}
	</span>
	
	<!-- nested objects -->
	<input name='nested.value' />
	<input use:userForm.nested.value />
	<span hidden={!userForm.errors.nested.value}>
		{userForm.errors.nested.value}
	</span>
	
	<!-- arrays -->
	<input name='array[0]' />
	<input use:userForm.array[0] />
	<span hidden={!userForm.errors.array[0]}>
		{userForm.errors.array[0]}
	</span>

	<!-- arrays+objects -->
	<input name='objArray[0].value' />
	<input use:userForm.objArray[0].value />
	<span hidden={!userForm.errors.objArray[0].value}>
		{userForm.errors.objArray[0].value}
	</span>

	<!-- success response? -->
	<span hidden={!userForm.success}>
		{userForm.success.message}
	</span>

	<button>Submit</button>
</form>

```

```ts

const User = z.object({...}) // Support different validators?

import { endpoint } from 'sveltekit-zero-api/zod'

const body = User
export const POST = endpoint(
	{ body: User },
	(event) => {
		event.body // May come from both FormData or JSON, but is now parsed
	},
	// * as many function as needed

	// ex.
	authGuard({ admin: true }), // may return Unauthorized
	(event) => {
		// only admins

		return { some: 'value' }
	},
	(event) => {
		event.endpoint.some === 'value' // true
	}
)

```

```ts

/*
	Untyped function responses

	This approach is good if you are very deep into code,
	any don't want to return a Response directly from a function.
	Ex. failing input.
*/

export function authGuard() {
	throw Unauthorized({ type: 'authfailed' }) // <- instanceof Error
	return 'Hi Shiba ♥ this fn returns a string!'
}

/*
	Console error:
		Response Error Unauthorized
			Body: {
				...
			}


	Note: have global interface API.Error to standardize
	error bodies. E.g.

	type Error = { type: string }
	// enforces
	Unuauthorized({ type: 'type_of_error' })

	Note: Custom validation error for JSON/Queryparams, so
	that those can also enforce that interface

*/



/*
	Typed function responses

	This typed, so that you can see what the body is.
	On the frontend, it is `instanceof Response` 
	and `instanceof ResponseProxy`.
	You can access the body directly, if you enable the setting.
	(e.g. response.body.message)
	(
		setting enabled in namespace App.API.UseResponseProxy, allowing type,
		this may be set automatically when server starts based on config.
		If false, return a normal Response
	)
	
	On the backend, it is `instanceof Error` and
	`instanceof KitResponse`. You can access the body directly.

	`KitResponse` - Backend
	`ResponseProxy` - Frontend
*/

export function authGuard() {
	return Unauthorized({
		type: 'cannot_access',
		message: 'You do not have access to this resource.'
	})
}

function anotherFn() {
	const result = authGuard()
	console.log(
		result.body.type,
		result.body.message
	)
}








/*
	I was just wondering, is it possible to use
	proxies in the backend, to make frontend/backend Responses
	similar?
	e.g.

	Probably not since bcz of the use of setTimeout(..., 0)
	for the chained functions to work and all that.
	It would be overcomplicated to create a wrapper around functions (?)
*/

function isTrue(value) {
	if(value === true)
		return OK({ message: 'Is true' })
	if(value === false)
		return BadRequest({ error: 'Is not true' })
	return value
}

async function someFn() {
	const [message] = await isTrue(true).$.OK(body => body.message)
	// or probably need a wrapper like
	const [message] = await api(isTrue(true)).$.OK(body => body.message)
	// if you want to grab the non-response?
	const value = await api(isTrue(true)).result
}

// ► this could probably be experimental AFTER, but not FOR Svelte hackathon.

export const GET = endpoint(...)

import { GET } from '$routes/api/...'
async function someFn() {
	const [result] = await GET(event,{ ... }).$.OK(body => body.message)
	/*
		Because we use the endpoint function for endpoints, we
		can recognize chained properties as the endpoint proxies
	*/
}

```




## Functions

```ts
import { functions, type API } from 'sveltekit-zero-api/server'
import z from 'zod'

const getImagesQuery = z.object({
	startAt: z.number(),
	limit: z.number()
}).optional()

function getCatImages(
	event: KitEvent, 
	body: z.input<typeof getImagesQuery> = {}
) {
	let result = getImagesQuery.safeParse(body)
	if(!result.success)
		return {
			error: { 
				type: 'invalid_parameters',
				message: 'Invalid body',
				result.error
			}
		}
	
	body = result.data
	
	return {...} // will be JSON.stringified
	return [...] // will be JSON.stringified
	return 123
	return 'abc'
	return true	
}

function catImage(event: KitEvent, id: string) {
	const stream: ReadableStream = ...
	// * Custom response type by providing 'content-type' and 'body'
	return {
		'content-type': 'application/webp',
		'cache-control': 'public, max-age=31536000, immutable',
		'body': stream
	} // will return body: unknown
}


/*
	body: {
		"function": "getCatImages",
		"body": [{
			...
		}] // params after KitEvent
	}
*/

// * api/cats
export const PATCH = functions({
	getCatImages,
	catImage
})

```


```svelte

<script lang='ts'>

	import { api } from '$lib'

	// instead of
	api.cats.GET({...})
	api.cats.images.GET({...})
	
	// I can do
	const catImages = api.cats.getCatImages({...})

</script>

<img src={api.catImage(1)} />

{#await catImages then images}
	{#each images as img}
		<img src='cat' alt='A cat' />
	{/each}
<!-- Promise rejects, if result has an error-key -->
{:catch error}
	Error occurred: {error.message}
{/await}

```






```ts

function create(...) {} // returns User
function update(...) {} // returns User
function get(...) {} // returns User[] | User
function sendMessage(
	event: KitEvent,
	userFrom: `User:${string}`,
	userTo: `User:${string}`,
	content: MessageContent
) {

} // returns MessageResult | { error: {...} }

function streamAIResponse(
	event: KitEvent,
	input: string
) {
	// ...

	return {
		// streaming response
		stream
	}
}



// * api/users
export const PATCH = functions(
	isLoggedIn,	
	(event) => {
		// these functions will run before the functions
		// below.
		// A lot like in endpoints, but counts for all functions below.
	},
	{
		create, update, get, sendMessage, streamAIResponse
	}
)

```

```svelte
<script lang='ts'>

	import { api } from '$lib'
	import { runedAPI, requestInit } from 'sveltekit-zero-api'

	/**
		note:
		If discriminator is missing, then it wont
			update the users list.

		// example check:
		if(!body?.id && !body?.[0]?.id)
			return
	*/
	const users = runedAPI(
		// discriminator
		body => body.id?.startsWith('User') && body.id,
		// api endpoint (e.g. functions-endpoint)
		api.users
	)

	users.get() // get user list
	users.get('User:1') // get User:1
	users.create(...)

	// { body: '{ "function": "create", "body": { "name": "Shiba" } }' }
	console.log(requestInit(api.users.create({ name: 'Shiba' })))

	function failedSend(error) {
		// ...
	}

	async function onUserChatEnter() {
		// without SvelteKit-zero-API
		const response = await fetch('/api/users/message', {
			method: 'POST',
			body: JSON.stringify({
				userFrom: 'User:1',
				userTo: 'User:2',
				message: {...}
			})
		}).catch(failedSend)
		if(!response.status !== 200) {
			failedSend(response)
			return
		}
		const result = await response.json()
	
		// SvelteKit-zero-API - endpoints
		const [result] = await api.users.messages.POST({
			userFrom: 'User:1',
			userTo: 'User:2',
			message: {...}
		})
			// if using `catch` (handles like error) the API will use `reject` 
			// and thus throws; not continuing
			.catch(failedSend)
			// if using `error` the API wont reject, and returns [undefined]
			// since it wont succeed
			.error(failedSend)
			.$.success({...})

		// SvelteKit-zero-API - functions
		const result = await api.users.sendMessage(
			'User:1', 'User:2', {...}
		).catch(failedSend)
		
		console.log(await result) // MessageResult
	}

	function onAIChatEnter() {
		const response = users.streamAIResponse(message)
		let index = aiChat.push('')
		for await (const part of response) {
			aiChat[index] += part
		}
	}

</script>

```



### `masterFunction: true`
> Not planned, but a nice to have.

If this config option is set to true, all functions frontend calls (within a few ticks) will be combined into a single request, that then streams the responses individually. This may eliminate the waterfall for use-cases with heavy API usage.

This endpoint is generated and simply imports other endpoints. The request to the master endpoint is
```ts

[{
	endpoint: "/api/users",
	function: "getUser",
	body: [...]
}, {
	endpoint: "/api/users",
	function: "sendMessage",
	body: [...]
}]

```

`event.locals` gets `structuredClone(...)` prior, to avoid problems across endpoints.
`event.endpoint` are individual objects for each endpoint.

## End

### Side note
I want to support streaming responses. I'll have to look into that.
I want to make sure to test different response body types, such as images, 8IntArray, and not just JSON etc.
I want to use Deno 2 for development and its test-suite to make sure SvelteKit-Zero-API V2 is "works" going forward. (I will continue to release npmjs)

### Acknowledgements
Include some acknowledgments when publishing V2

Another, less relevant detail to this — is that I want it to work well with my other library [svelte-object](https://github.com/Refzlund/svelte-object) which I migrated to Svelte 5 last month. While svelte-object will not dictate how sveltekit-zero-api works, I will definitely impact how I try to make sveltekit-zero-api work well with other libraries (and of course your own code).

A more relevant detail — [kauderk](https://github.com/kauderk) on this [GitHub Issue](https://github.com/Refzlund/sveltekit-zero-api/issues/15) gave me the insight, that you could build a library that depends on sveltekit-zero-api. I hadn't thought of that. I want to take this valuable insight into consideration when creating this library: Another library might use some functionality of sveltekit-zero-api to interact with a certain set of APIs (ex. OpenAI api).

Last but not least, thank you [ymzuiku](https://github.com/ymzuiku) for sparking my initial interest in this library. I forked the initial `svelte-zero-api` as I was new to development, publishing, PRs, issue tracking and working with others — so in order not to be a burden, I forked. That had led me to "freely" experiment, learn the ups and downs of certain paradigms and grow as a developer. I believe that has led me to create something that I myself use on a daily basis, and is proud of. Thank you.

Much love,
Giraffe🦒❤️