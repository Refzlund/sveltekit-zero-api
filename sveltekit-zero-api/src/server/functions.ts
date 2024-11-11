import { BadRequest, InternalServerError, KitResponse } from "./http.ts";
import { KitEvent } from './kitevent.ts';

type FnsRecord = Record<string, (event: KitEvent, ...args: any[]) => KitResponse | Promise<KitResponse>>

/**
 * Creates an endpoint with the functions format.
 * 
 * The endpoint is called with a JSON-body like so:
 * ```jsonc
 * {
 *     "function": "someFn", // function name
 *     "arguments": [...] // arguments-array passed to function name
 * }
 * ```
 * It's of course limited to JSON applicable content.
 */
export function functions<Fns extends FnsRecord>(
	fns: Fns
) {
	async function functionsHandler(event: KitEvent<{ body: { function: string; arguments: unknown[] } }>) {
		let json
		try {
			json = await event.request.json()
		} catch (error) {
			return new BadRequest({ code: 'invalid_json', error: 'Invalid JSON' })
		}

		const { function: fn, arguments: args } = json
		if (!fn || typeof fn !== 'string') {
			return new BadRequest({
				code: 'missing_function',
				error: 'Please provide a function, by providing a `function` property in the body'
			})
		}

		if (!fns[fn]) {
			return new BadRequest({
				code: 'invalid_function',
				error: 'Invalid function name'
			})
		}

		if (args && !Array.isArray(args)) {
			return new BadRequest({
				code: 'invalid_arguments',
				error: 'The `arguments` property must be undefind or an array of arguments for the provided function.',
				details: {
					received: args,
					expected: 'Array | undefined'
				}
			})
		}
		try {
			return fns[fn](event, ...args)
		} catch (error) {
			throw new InternalServerError({
				code: 'function_failed',
				error: 'An unexpected error occurred when running the function.'
			}, { cause: error })
		}
		
	}

	let $ = {...fns}

	let proxy = new Proxy($, {
		get(target, key) {
			if(!(key in target)) {
				return target[key as any]
			}
			return (...args: [any]) => new Promise((resolve, reject) => {
				try {
					functionProxyResolve({
						resolve,
						reject,
						response: target[key as any](...args),
						fn: key as string,
						args
					})
				} catch (error) {
					reject(
						new InternalServerError({
							code: 'function_failed',
							error: 'An unexpected error occurred when running the function.'
						}, { cause: error })
					)
				}
			})
		}
	})

	Object.assign(functionsHandler, { $: proxy })

	return functionsHandler as typeof functionsHandler & { $: Fns }
}

// Doing this as Deno don't like awaiting a Promise callback
async function functionProxyResolve({
	resolve, reject, response, fn, args
}: {
	resolve: (value: unknown) => void
	reject: (reason?: any) => void
	response: KitResponse | Promise<KitResponse>
	fn: string
	args: any
}) {
	await response
	if (!(response instanceof KitResponse)) {
		throw new Error('Function did not return a KitResponse', { cause: { function: fn, arguments: args } })
	}
	if(response.ok) {
		return resolve(response)
	}
	return reject(response)
}