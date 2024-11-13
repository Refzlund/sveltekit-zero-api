import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'

export default defineConfig({
	plugins: [
		deno(),
		sveltekit()
	]
})
