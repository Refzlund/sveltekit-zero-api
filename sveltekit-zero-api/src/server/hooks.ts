import type { Handle } from '@sveltejs/kit'
import { KitResponse } from './http.ts'

interface Options {
	client?: {
		/**
		 * If `true`, access body directly on client via `response.json`
		 * when using `api...`
		 *
		 * This is done by providing the reasponse header:
		 * `'sveltekit-zero-api-json': 'true'`
		 * 
		 * @default false
		 */
		awaitJSON?: boolean
	}
}

/**
 *
 * [SvelteKit ZeroAPI](https://github.com/Refzlund/sveltekit-zero-api) —
 * Middleware for SvelteKit hooks handler. Catches and translates `KitResponse` to `Response`.
 *
 * @example
 *
 * import { sequence } from '@sveltejs/kit/hooks'
 * import { zeroapi } from 'sveltekit-zero-api/server'
 *
 * export const handle = sequence(
 *     zeroAPI(),
 *     (...) => {
 *
 *     }
 * )
 *
 */
export function zeroAPI(options: Options) {

	const handle: Handle = async ({ event, resolve }) => {
		// @ts-expect-error RequestEvent should not have `results` inside of it.
		event.results ??= {}
		let response: unknown

		try {
			response = await resolve(event)
		} catch (error) {
			if (!(error instanceof KitResponse)) throw error
			response = error
		}

		if(options.client?.awaitJSON) {
			event.setHeaders({
				'sveltekit-zero-api-json': 'true'
			})
		}

		if (!(response instanceof KitResponse)) return response

		return new Response(response.body, {
			status: response.status,
			headers: response.headers
		}) as any
	}

	return handle
}
