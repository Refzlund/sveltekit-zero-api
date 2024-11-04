<script module lang='ts'>
	
	export interface OptionProps {
		children?: Snippet
		value: any
	}

</script>

<script lang="ts">

	import { getContext, onMount, type Snippet } from 'svelte'

	let props: OptionProps = $props()
	const parent = getContext('select-options') as OptionProps[]
	
	if(!parent)
		throw new Error('<Select.Option> Must be a child of <Select>')

	onMount(() => {
		parent.push(props)
		return () => parent.splice(parent.indexOf(props), 1)
	})

</script>