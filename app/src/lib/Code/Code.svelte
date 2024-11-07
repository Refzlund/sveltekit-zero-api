<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">
	import { undentString } from '$lib/undent-string'
	import hljs from 'highlight.js'
	import 'highlight.js/styles/atom-one-dark.css'

	interface Props {
		code: Record<string, string>
	}

	let { code }: Props = $props()

	let formatted = $derived.by(() => {
		let formatted = {...code}
		for(let key in formatted) {
			const lines = hljs.highlight(undentString(formatted[key]), { language: key.split('.').pop()! }).value.split('\n')
			const html = lines.map((line, index) => {
				return `<span class='line-count'>${index+1}</span>${line}`
			}).join('\n')

			formatted[key] = html
		}
		return formatted
	})

	let height = $state(28)
	
	let active = $state(Object.keys(code)[0])

</script>
<!---------------------------------------------------->



<code-container>
	<tabs>
		{#each Object.keys(code) as tab}
			<button
				class:active={tab === active}
				class='text-gray-500'
				onclick={() => active = tab}
			>
				{tab}
			</button>
		{/each}
	</tabs>
	<container style='height: {height}px'>
		<pre bind:clientHeight={height}><code>{@html formatted[active]}</code></pre>
	</container>
</code-container>



<!---------------------------------------------------->
<style lang='postcss'>

	.active {
		@apply text-primary;
	}

	container {
		@apply block overflow-hidden;
		transition: height 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	code-container {
		@apply block;

		:global .line-count {
			@apply inline-flex opacity-20 w-8 items-center justify-end pointer-events-none select-none -translate-x-6;
		}

		code :global {
			font-size: .9rem;
		}

		code {
			@apply max-w-full text-wrap;
		}

		pre, button, container {
			@apply block bg-gray-950 rounded-lg border border-gray-800;
		}

		pre {
			@apply p-4 px-8 border-0;
		}

		button {
			@apply inline-block px-4 py-0.5 rounded-b-none border-b-0 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap duration-100;
			&:not(.active) {
				@apply hover:bg-gray-900;
			}
		}

		tabs {
			@apply flex mx-4 z-10 translate-y-[1px] gap-1;
		}
	}

</style>