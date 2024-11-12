import type { Handle, ResolveOptions } from '@sveltejs/kit'
import { KitResponse } from './http.ts'
import { KitEvent } from "./kitevent.ts";
import { sequence as sveltekitSequence } from "@sveltejs/kit/hooks";

type KitHandle = (
	event: KitEvent,
	resolve: (event: KitEvent, opts?: ResolveOptions) => Promise<KitResponse | Response>
) => Promise<KitResponse | Response> | KitResponse | Response

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
	sever?: {
		/**
		 * Whether to stringify objects to JSON when no 'content-type' is provided.
		 *
		 * If you do `setHeader('content-type', ...)` then it won't stringify.
		 *
		 * @default true
		 */
		stringify?: boolean

		/**
		 * Log KitResponses that has `{ cause: ... }`?
		 *
		 * @default true
		 */
		logWithCause?: boolean
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
 *     zeroAPI({...}),
 *     (...) => {
 *
 *     }
 * )
 * 
 * /// Optionally, if you want use KitEvent-type and return KitResponse 
 * /// without type-errors, you can do
 * 
 * export const handle = zeroAPI({...}).sequence(
 *     (...) => {
 *
 *     }
 })
 */
export function zeroAPI({
	client: {
		awaitJSON = true
	} = {},
	sever: {
		stringify = true,
		logWithCause = true
	} = {}
}: Options) {

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

		if (!(response instanceof KitResponse)) return response

		// @ts-expect-error Hidden property
		let cause = response.cause as unknown
		if (cause && logWithCause) {
			let stringed = cause.toString()
			if (stringed.startsWith('[object ') && stringed.endsWith(']')) {
				try {
					stringed = JSON.stringify(cause)
				} catch (error) {
					stringed = 'Could not parse KitResponse[cause] into string: ' + error
				}
			}
			console.log('- KitResponse with cause: ', KitResponse)
		}

		if(awaitJSON) {
			event.setHeaders({
				'sveltekit-zero-api-json': 'true'
			})
		}

		let body = response.body
		if (stringify && !response.headers.has('content-type') && typeof body === 'object') {
			event.setHeaders({
				'content-type': 'application/json'
			})
			body = JSON.stringify(body)
		}

		return new Response(body, {
			status: response.status,
			headers: response.headers
		}) as any
	}

	function sequence(...handlers: KitHandle[]) {
		return sveltekitSequence(handle, ...(handlers as unknown as Handle[]))
	}

	Object.assign(handle, { sequence })

	return handle as typeof handle & { sequence: typeof sequence }
}

