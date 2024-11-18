import type { Plugin } from 'vite'
import * as fs from 'node:fs'
import process from 'node:process'
import Path from 'node:path'
import { generateTypes } from "./generation/generate-types-file.ts";

const cwd = process.cwd()

interface ZeroAPIOptions {
	/**
	 * The path where the `api.ts` is located.
	 * If `undefined` then the file wont be generated.
	 *
	 * If `customTypePath` is ***also*** `undefined`, no types will be generated.
	 * @default './src/api.ts'
	 */
	apiPath?: string

	/**
	 * By default, it will be located in `.svelte-kit/types/src/...` relative
	 * to the `apiPath` config.
	 *
	 * For instance `.svelte-kit/types/src/api.d.ts`
	 *
	 * @default undefined
	 * @example './src/api.d.ts'
	 */
	customTypePath?: string
}

let timeout: number | undefined
function update(options: ZeroAPIOptions) {
	if (timeout !== undefined) clearTimeout(timeout)
	timeout = setTimeout(() => {
		fs.writeFileSync(
			Path.resolve(cwd, options.customTypePath ?? './.svelte-kit/types' + options.apiPath!.replace(/\.ts$/, '.d.ts')),
			generateTypes(Path.resolve(cwd, './src'), 'routes')
		)
	}, 111) // sveltekit debounces by 100ms
}

export default function viteZeroAPI(options: ZeroAPIOptions): Plugin {
	if (process.env.NODE_ENV === 'production')
		return { name: 'vite-plugin-sveltekit-zero-api' }

	options.apiPath ??= './src/api.ts'
	options.customTypePath ??= undefined

	return {
		name: 'vite-plugin-sveltekit-zero-api',
		configureServer(vite) {
			update(options)
			vite.watcher.on('change', () => update(options))
		}
	}
}
