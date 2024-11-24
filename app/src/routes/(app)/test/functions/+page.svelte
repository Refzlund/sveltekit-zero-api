<script lang='ts'>

	import api from '$lib/../api'
	import { onMount } from 'svelte'

	// api.fns.someFunction().catch(res => console.log('caught', res.body))


	let message = $state('')
	onMount(async () => {
		for await (let result of await api.fns.streamingData()) {
			message += result.data + ' '
		}
	})
</script>
<!---------------------------------------------------->

{message}





<!---------------------------------------------------->
<style lang='postcss'>
	
	

</style>