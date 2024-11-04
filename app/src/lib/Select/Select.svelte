<!-- @component

	A single select dropdown

@example
<Select bind:value>
	Value will be displayed, if no children
	<Select.Option value='First value' /> 
	<Select.Option value='2nd'>Second value</Select.Option> 
</Select>

-->

<script lang="ts">

	import { setContext, type Snippet } from 'svelte'
	import type { OptionProps } from './Option.svelte'
	import { flip, floatingUI, offset } from '$lib/floating-ui.svelte'
	import { portal } from '$lib/portal.svelte'
	import { fly } from 'svelte/transition'

	interface Props {
		/** Shown when empty value*/
		label?: string
		children: Snippet
		value?: any
	}

	let { 
		children, 
		label, 
		value = $bindable(undefined)
	}: Props = $props()

	const options = $state([] as OptionProps[])

	setContext('select-options', options)

	let float = floatingUI({
		placement: 'bottom',
		middleware: [
			offset(10),
			flip()
		]
	})

	let width = $state(10)

	let selected = $derived(options.find(o => o.value === value))

	let open = $state(false)

</script>
<!---------------------------------------------------->

{@render children?.()}

<button
	class='select'
	class:open
	onclick={() => open = !open}
	bind:clientWidth={width}
	use:float.ref
>
	<span>
		{#if !selected}
			{label ?? 'Select'}
		{:else}
			{#if selected.children}
				{@render selected.children?.()}
			{:else}
				{selected.value}
			{/if}
		{/if}
	</span>
	<icon class='iconify fluent--chevron-right-20-regular'></icon>
</button>

<!--
	We use a dialog to display the dropdown above
	all other elements.

	We portal it to the body, for potential unsupported browsers.
-->

{#if open}
	<dialog
		open
		style='width: {width}px'
		transition:fly|global={{ y: -10, duration: 150 }}
		use:float
		use:portal
	>
		{#each options as option (option)}
			{#if option.value !== value}
				<button
					class='item'
					onclick={() => {
						value = option.value
						open = false
					}}
				>
					{#if option.children}
						{@render option.children?.()}
					{:else}
						{option.value}
					{/if}
				</button>
			{/if}
		{/each}
	</dialog>
{/if}

<!---------------------------------------------------->
<style lang='postcss'>

	button.select {
		@apply 
			flex rounded justify-between px-3 py-2 border border-primary 
			border-opacity-50 hover:border-opacity-75 duration-100 items-center
		;
		&.open { @apply border-opacity-100; }
		icon { @apply size-5 duration-150 rotate-0; }
		&.open icon { @apply rotate-90; }
	}
	
	dialog {
		@apply
			grid grid-flow-row gap-1
			m-0 bg-gray-950 bg-opacity-30 text-gray-200 z-[1000]
			px-1.5 py-2 rounded-lg backdrop-blur-sm border border-gray-800
		;
	}

	.item {
		@apply flex items-center p-2 cursor-pointer rounded;

		&:hover {
			@apply bg-gray-600 bg-opacity-30;
		}
	}

</style>