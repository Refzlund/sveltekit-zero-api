import { Promisify } from '../utils/types.ts'
import { Functions, FnsRecord } from './functions.type.ts'
import { BadRequest, InternalServerError, KitResponse, StatusCode } from './http.ts'
import { KitEvent } from './kitevent.ts'

/**
 * We use the `GenericFn` class to tell `sveltekit-zero-api` that it
 * needs to call the returned function instead of returning it immediately — expecting a KitResponse.
 * 
 * @example
 * interface Input {
 *     name: string
 *     age: number
 * }
 * 
 * function someFn<T extends Simplify<Input>>(event: KitEvent, input: T) {
 *     if (Math.random() > 0.5) {
 *         return new BadRequest({ code: 'invalid', error: 'You are quite the unlucky fellow.' })
 *     }
 * 
 *     return new OK({
 *         providedData: input
 *     })
 * }
 * 
 * const PATCH = functions({
 *     someFn,
 *     specificFn: (event) =>
 *         /// We provide GenericFn to tell the endpoint to call an additional functioon
 *         new GenericFn(<const T extends Input>(input: T) => {
 *             /// We use GenericFn.return to return correct type
 *             return GenericFn.return(someFn(event, input))
 *         })
 *     }
 * )
 */
export class GenericFn<T extends Function> {
	function: T
	constructor(fn: T) {
		this.function = fn
	}

	static return<T extends KitResponse>(response: T) {
		return response as unknown as Promisify<
			Extract<T, KitResponse<StatusCode['Success']>>['body'],
			| Exclude<Extract<T, KitResponse>, KitResponse<StatusCode['Success']>>
			| InternalServerError<{
					code: 'function_failed'
					error: 'An unexpected error occurred when running the function.'
			  }>
		>
	}
}

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
 *
 * @note Do not end function names in `$` as those are reserved for route slugged params.
 */
export function functions<const Fns extends FnsRecord>(fns: Fns) {
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
			let result = await fns[fn](event, ...args)
			if(result instanceof GenericFn) {
				return result.function(...args)
			}
			return result
		} catch (error) {
			throw new InternalServerError(
				{
					code: 'function_failed',
					error: 'An unexpected error occurred when running the function.'
				},
				{ cause: error }
			)
		}
	}

	let $ = function $(event: KitEvent) {
		$['__proxy'] ??= new Proxy(fns, {
			get(target, key) {
				if (!(key in target)) {
					return target[key as any]
				}
				return (...args: [any]) => {
					return new Promise((resolve, reject) => {
						try {
							functionProxyResolve({
								resolve,
								reject,
								fn: target[key as any],
								event,
								args
							})
						} catch (error) {
							reject(
								new InternalServerError(
									{
										code: 'function_failed',
										error: 'An unexpected error occurred when running the function.'
									},
									{ cause: { function: key, arguments: args, error } }
								)
							)
						}
					})
				}
			}
		})

		return $['__proxy']
	}

	Object.assign(functionsHandler, { $ })
	return functionsHandler as typeof functionsHandler & { $: (event: KitEvent) => Functions<Fns> }
}

// Doing this as Deno don't like awaiting a Promise callback
async function functionProxyResolve({
	resolve,
	reject,
	fn,
	args,
	event
}: {
	event: KitEvent
	resolve: (value: unknown) => void
	reject: (reason?: any) => void
	fn: FnsRecord[string]
	args: any
}) {
	let result: KitResponse | GenericFn<any> = await fn(event, ...args)
	if (result instanceof GenericFn) {
		result = result.function(...args)
	}
	if (!(result instanceof KitResponse)) {
		throw new Error('Function did not return a KitResponse', { cause: result })
	}
	if (result.ok) {
		return resolve(result.body)
	}
	return reject(result)
}
