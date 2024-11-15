import type { UnionToIntersection } from './../utils/types';
import type { Functions, FnsRecord } from './functions.type.ts'
import { Generic } from "./generic.ts";
import { BadRequest, InternalServerError, KitResponse } from './http.ts'
import type { KitEvent } from './kitevent.ts'

type FunctionCallbackResult = Record<PropertyKey, any> | KitResponse | void

type FnCallback<
	Result extends FunctionCallbackResult = FunctionCallbackResult,
	R1 extends FunctionCallbackResult = never,
	R2 extends FunctionCallbackResult = never,
	R3 extends FunctionCallbackResult = never,
	R4 extends FunctionCallbackResult = never,
	R5 extends FunctionCallbackResult = never,
	R6 extends FunctionCallbackResult = never,
> = 
	(event: KitEvent<FunctionsBody, UnionToIntersection<Exclude<R1 | R2 | R3 | R4 | R5 | R6, KitResponse>>>) => Result | Promise<Result>

interface FunctionsBody {
	body: { 
		function: string
		arguments: unknown[]
	}
}

export function functions<const Fns extends FnsRecord>(fns: Fns): 
	(event: KitEvent<FunctionsBody>) => KitResponse & { use: Functions<Fns> }



// #region functions overloads

export function functions<const Fns extends FnsRecord, B1 extends FunctionCallbackResult>(
	cb1: FnCallback<B1>, 
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { use: Functions<Fns, Extract<B1, KitResponse>> }

export function functions<
	const Fns extends FnsRecord, 
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>, 
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { 
	use: Functions<Fns, Extract<B1 | B2, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord, 
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { 
	use: Functions<Fns, Extract<B1 | B2 | B3, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord, 
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { 
	use: Functions<Fns, Extract<B1 | B2 | B3 | B4, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord, 
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult,
	B5 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	cb5: FnCallback<B5, B1, B2, B3, B4>,
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { 
	use: Functions<Fns, Extract<B1 | B2 | B3 | B4 | B5, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord, 
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult,
	B5 extends FunctionCallbackResult,
	B6 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	cb5: FnCallback<B5, B1, B2, B3, B4>,
	cb6: FnCallback<B6, B1, B2, B3, B4, B5>,
	fns: Fns
): (event: KitEvent<FunctionsBody>) => KitResponse & { 
	use: Functions<Fns, Extract<B1 | B2 | B3 | B4 | B5 | B6, KitResponse>>
}

// #endregion



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
export function functions(
	...args: (FnCallback | FnsRecord)[]
) {
	let fns = args.pop()! as FnsRecord	
	let cbs = args as FnCallback[]

	function functionsHandler(event: KitEvent<FunctionsBody, never>) {
		/** Use on backend */
		let useProxy = null as null | FnsRecord

		let promise = functionRequest(event, fns!, cbs, () => !!useProxy)

		Object.assign(promise, {
			get use() {
				useProxy ??= new Proxy(fns!, {
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
										args,
										cbs
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
				return useProxy
			}
		})

		return promise as any
	}

	return functionsHandler
}

async function functionRequest(event: KitEvent<any, never>, fns: FnsRecord, cbs: FnCallback[], useProxy: () => boolean) {
	let json: Record<PropertyKey, any>
	try {
		json = await event.request.json()
		if (useProxy()) return
	} catch (error) {
		if (useProxy()) return
		return new BadRequest({ code: 'invalid_json', error: 'Invalid JSON', details: error })
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
		for (const cb of cbs) {
			const result = await cb(event)
			if (result instanceof KitResponse)
				return result
			if (typeof result === 'object') {
				event.results ??= {}
				Object.assign(event.results, result)
			}
		}

		let result = await fns[fn](event, ...args)
		if (result instanceof Generic) {
			return result.function(...args)
		}
		return result
	} catch (error) {
		if (error instanceof KitResponse) {
			throw error
		}

		throw new InternalServerError(
			{
				code: 'function_failed',
				error: 'An unexpected error occurred when running the function.'
			},
			{ cause: error }
		)
	}
}

// Doing this as Deno don't like awaiting a Promise callback
async function functionProxyResolve({
	resolve, reject, fn, args, event, cbs
}: {
	event: KitEvent<any, never>
	resolve: (value: unknown) => void
	reject: (reason?: any) => void
	fn: FnsRecord[string]
	args: any,
	cbs: FnCallback[]
}) {
	for (const cb of cbs) {
		const result = await cb(event)
		if (result instanceof KitResponse) {
			if (result.ok) return resolve(result.body)
			return reject(result)
		}
		if (result) {
			event.results ??= {}
			Object.assign(event.results, result)
		}
	}

	let result: KitResponse | Generic<any> = await fn(event, ...args)
	if (result instanceof Generic) {
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
