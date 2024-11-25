import { createEndpointProxy } from '../endpoint-proxy'
import type { FixKeys, Simplify } from '../utils/types'
import { BadRequest, KitResponse } from './http'
import { ParseKitEvent, type KitEvent, type KitEventFn } from './kitevent'
import type { EndpointProxy } from '../endpoint-proxy.type'
import { Generic } from './generic'
import { convertResponse } from './convert-response'
import { parseResponse } from '../utils/parse-response'

/**
 * The "result" of an `endpoint` paramters `callback`
 */
export type EndpointCallbackResult = Record<PropertyKey, any> | KitResponse | ParseKitEvent

/**
 * A callback function for an `endpoint` parameter.
 */
interface Callback<Event extends KitEvent<any, any>, Result extends EndpointCallbackResult> {
	(event: Event): Promise<Result> | Result | void
}

/**
 * The input for an endpoint.
 */
type EndpointInput<Results extends EndpointCallbackResult> = Simplify<
	FixKeys<Pick<Extract<Results, ParseKitEvent<any, any>>, 'body' | 'query'>>
>

type GenericCallback = Generic<
	| ((body: any) => EndpointProxy<KitResponse<any, any, any>>)
	/** When `body` is not available. E.g. `GET`, `HEAD`, `TRACE` */
	| ((options: { query: any }) => EndpointProxy<KitResponse<any, any, any>>)
	| ((body: any, options: { query: any }) => EndpointProxy<KitResponse<any, any, any>>)
>

export type EndpointFunction<
	Input extends {
		body?: any
		query?: any
	} = any,
	Result extends KitResponse = KitResponse<any, any>
> = ((body?: Input['body'], options?: { query?: Input['query'] } & RequestInit) => EndpointProxy<Result>) & {
	xhr: (
		body?: Input['body'],
		options?: { query?: Input['query'] } & RequestInit
	) => EndpointProxy<Result, never, true>
}

/**
 * The return-type for an `endpoint`.
 */
export interface EndpointResponse<
	Results extends EndpointCallbackResult,
	G extends null | GenericCallback = null
> {
	(event: KitEvent): Promise<Extract<Results, KitResponse>> & {
		use: null extends G
			? EndpointFunction<EndpointInput<Results>, Extract<Results, KitResponse>>
			: G extends Generic<infer Input>
			? Input
			: never
	}
}

// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint overloads

function endpoint<B1 extends KitResponse, TGenericResult extends null | GenericCallback = null>(
	/** When creating a `Generic` endpoint, the body WILL be parsed as JSON. */
	callback1: Callback<KitEvent, B1> | ((event: KitEvent) => Promise<TGenericResult> | TGenericResult)
): EndpointResponse<B1, TGenericResult>

function endpoint<B1 extends EndpointCallbackResult, B2 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>
): EndpointResponse<B1 | B2>

function endpoint<B1 extends EndpointCallbackResult, B2 extends EndpointCallbackResult, B3 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>
): EndpointResponse<B1 | B2 | B3>

function endpoint<
	B1 extends EndpointCallbackResult,
	B2 extends EndpointCallbackResult,
	B3 extends EndpointCallbackResult,
	B4 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>
): EndpointResponse<B1 | B2 | B3 | B4>

function endpoint<
	B1 extends EndpointCallbackResult,
	B2 extends EndpointCallbackResult,
	B3 extends EndpointCallbackResult,
	B4 extends EndpointCallbackResult,
	B5 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>
): EndpointResponse<B1 | B2 | B3 | B4 | B5>

function endpoint<
	B1 extends EndpointCallbackResult,
	B2 extends EndpointCallbackResult,
	B3 extends EndpointCallbackResult,
	B4 extends EndpointCallbackResult,
	B5 extends EndpointCallbackResult,
	B6 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6>

function endpoint<
	B1 extends EndpointCallbackResult,
	B2 extends EndpointCallbackResult,
	B3 extends EndpointCallbackResult,
	B4 extends EndpointCallbackResult,
	B5 extends EndpointCallbackResult,
	B6 extends EndpointCallbackResult,
	B7 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>,
	callback7: Callback<KitEventFn<B1, B2, B3, B4, B5, B6>, B7>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6 | B7>

// #endregion

function endpoint<const Callbacks extends [...Callback<KitEvent, EndpointCallbackResult>[]]>(
	...callbacks: Callbacks
) {
	return (event: KitEvent) => {
		let useProxy: ReturnType<typeof createEndpointProxy> | null = null

		async function endpointHandler() {
			await new Promise((res) => res(true))

			event.results ??= {}

			let result: EndpointCallbackResult | void
			for (const callback of callbacks) {
				try {
					result = await callback(event)
					if (result instanceof Generic) {
						try {
							event.body = await event.request.json()
						} catch (error) {
							throw new BadRequest({
								code: 'invalid_json',
								error: 'A generic endpoint must receive JSON',
								details: error
							})
						}
						result = await result.function()
					}
				} catch (error) {
					if (error instanceof KitResponse) {
						result = error
					} else {
						throw error
					}
				}
				if (result instanceof KitResponse) {
					return result
				}
				if (result instanceof ParseKitEvent) {
					event.body = result.body
					event.query ??= {}
					Object.assign(event.query, result.query ?? {})
					continue
				}

				if (result) {
					Object.assign(event.results!, result)
				}
			}

			return result!
		}

		const promise = endpointHandler()
			.then((v) => convertResponse(v, event.zeroAPIOptions))
			.catch((err) => {
				if (err instanceof KitResponse) {
					return convertResponse(err, event.zeroAPIOptions)
				}
				throw err
			}) as Promise<Response>

		Object.assign(promise, {
			use(input?: { body?: unknown }, options?: { query?: unknown }) {
				const headers = event.request.headers ?? new Headers()

				let body: BodyInit | null = null
				let method = event.request.method

				if (String(input) === '[object Object]') {
					body = JSON.stringify(input)
					headers.set('content-type', 'application/json')
					method = method === 'GET' ? 'POST' : method
				}

				event.request = new Request(event.request.url, {
					...event.request,
					method,
					headers,
					body
				})

				event.query ??= {}
				Object.assign(event.query, options?.query ?? {})

				useProxy ??= createEndpointProxy(
					promise
						.catch(async (res) => {
							if (!('headers' in res)) throw res
							return res as Response
						})
						.then(parseResponse)
				)
				return useProxy
			}
		})

		return promise
			
	}
}

export { endpoint }
