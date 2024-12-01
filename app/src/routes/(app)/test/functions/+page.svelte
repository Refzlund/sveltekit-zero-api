<script lang='ts'>

	import api from '$lib/../api'
	import { onMount } from 'svelte'

	// api.fns.someFunction().catch(res => console.log('caught', res.body))

	let message = $state('')
	let message2 = $state('')
	let message3 = $state('')

	onMount(async () => {
		for await (let result of await api.fns.streamingData()) {
			message += result.data + ' '
		}
	})

	api.fns.PUT().OK(async res => {
		for await (let result of res.body) {
			message2 += result.data + ' '
		}
	})

	api.fns.SSE()
		.on.event1(e => message3 += e.data + ' ')
		.on.event2(e => message3 += `<i>${e.data2}</i> `)

</script>
<!---------------------------------------------------->

<div>
	{message}
</div>
<div>
	{message2}
</div>
<div>
	{@html message3}
</div>

<!---------------------------------------------------->
<style lang='postcss'>
	
	

</style>