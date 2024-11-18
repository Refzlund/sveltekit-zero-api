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
	resolve: {
		alias: {
			'@scope/sveltekit-zero-api': join(dirname(fromFileUrl(import.meta.url)), '../sveltekit-zero-api')
		}
	}
})
