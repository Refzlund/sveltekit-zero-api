import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'
import zeroAPI from 'sveltekit-zero-api/vite'

export default defineConfig({
	plugins: [
		deno(),
		sveltekit(),
		zeroAPI()
	]
})
