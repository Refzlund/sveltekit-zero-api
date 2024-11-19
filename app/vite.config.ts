import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'
import zeroAPI from '@scope/sveltekit-zero-api/vite'
import { fromFileUrl, dirname, join } from '@std/path'

export default defineConfig({
	plugins: [
		deno(),
		sveltekit(),
		zeroAPI({
			customTypeImport: 'import type { ServerType as S } from "@scope/sveltekit-zero-api/client"'
		})
	],
	server: {
		fs: {
			allow: ['..']
		}
	},
	resolve: {
		alias: {
			'@scope/sveltekit-zero-api/server': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api/src/server/index.ts'),
			'@scope/sveltekit-zero-api/http': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api/src/server/http.ts'),
			'@scope/sveltekit-zero-api/formapi.svelte': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api/src/client/formapi.svelte.ts'),
			'@scope/sveltekit-zero-api/client': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api/src/client/index.ts'),
			'@scope/sveltekit-zero-api': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api/src/index.ts'),
		}
	}
})
