import type { Plugin } from 'vite'
import * as fs from 'node:fs'
import process from 'node:process'
import Path from 'node:path'
import { generateTypes } from "./generation/generate-types-file.ts";

const cwd = process.cwd()

export default function viteZeroAPI(): Plugin {
	if (process.env.NODE_ENV === 'production')
		return { name: 'vite-plugin-sveltekit-zero-api' }

	return {
		name: 'vite-plugin-sveltekit-zero-api',
		configureServer(vite) {
			vite.watcher.on('change', () => {
				setTimeout(() => {
					fs.writeFileSync(
						Path.resolve(cwd, './src/api.d.ts'),
						generateTypes(Path.resolve(cwd, './src'), 'routes')
					)
				}, 111)
			})
		}
	}
}
