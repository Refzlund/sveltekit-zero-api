<script>
	import Code from '$lib/Code/Code.svelte'
	import LogoText from '$lib/LogoText.svelte'

	const code = {
		'functions.ts': `
			// SvelteKit-Zero-API - functions
			const result = await api.users.sendMessage(
				'User:1', 'User:2', {...}
			).catch(failedSend)
		`,
		'endpoints.ts': `
			// SvelteKit-Zero-API - endpoints
			const [result] = await api.users.messages.POST({
				userFrom: 'User:1', userTo: 'User:2',
				message: {...}
			})
				.error(failedSend)
				.$.success(r => r.body)
		`,
		'no-zero-api.ts': `
			// without SvelteKit-Zero-API
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
			const result = await response.json() as MessageResult
		`
	}

</script>
<article>
	<h1>Seamless development</h1>
	<p>
		<LogoText/> aims to provide a seamless experience,
		developing between frontend and backend.
	</p>
	<p>
		I think it's well established, the code can talk for itself<img class='inline !m-0' src='/star_struck.gif' alt='star-struck' width="30" />
	</p>

	<Code {code} />

</article>


<style lang='postcss'>

	article {
		@apply prose prose-invert prose-blue prose-h1:font-medium;
	}

</style>