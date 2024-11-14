import type { Generic } from './functions'
import { createEndpointProxy } from '../endpoint-proxy.ts'
import type { FixKeys, Simplify } from '../utils/types.ts'
import { KitResponse } from './http.ts'
import { ParseKitEvent, type KitEvent, type KitEventFn } from './kitevent.ts'
import type { EndpointProxy } from '../endpoint-proxy.type.ts'

/**
 * The "result" of an `endpoint` paramters `callback`
 */
export type EndpointCallbackResult = Record<PropertyKey, any> | KitResponse | ParseKitEvent

/**
 * A callback function for an `endpoint` parameter.
 */
interface Callback<Event extends KitEvent<any, any>, Result extends EndpointCallbackResult> {
	(event: Event): Promise<Result> | Result
}

/**
 * The input for an endpoint.
 */
type EndpointInput<Results extends EndpointCallbackResult> = Simplify<
	FixKeys<Pick<Extract<Results, ParseKitEvent<any, any>>, 'body' | 'query'>>
>

/**
 * The return-type for an `endpoint`.
 */
interface EndpointResponse<Results extends EndpointCallbackResult> {
	(event: KitEvent): Promise<Extract<Results, KitResponse>> & {
		use: (input?: EndpointInput<Results>) => EndpointProxy<Extract<Results, KitResponse>>
	}
}

// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint overloads

type GenericCallback<T> =
	| Generic<(body: unknown) => T>
	/** When `body` is not available. E.g. `GET`, `HEAD`, `TRACE` */
	| Generic<(options: { query: Record<string, unknown> }) => T>
	| Generic<(body: unknown, options: { query: Record<string, unknown> }) => T>

type GenericLastReturn = GenericCallback<KitResponse>
type GenericOthers = GenericCallback<EndpointCallbackResult>

type LastReturn = KitResponse | GenericLastReturn
type OtherReturn = EndpointCallbackResult | GenericOthers

function endpoint<B1 extends LastReturn>(callback1: Callback<KitEvent, B1>): EndpointResponse<B1>

function endpoint<B1 extends OtherReturn, B2 extends LastReturn>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>
): EndpointResponse<B1 | B2>

function endpoint<B1 extends OtherReturn, B2 extends OtherReturn, B3 extends LastReturn>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>
): EndpointResponse<B1 | B2 | B3>

function endpoint<B1 extends OtherReturn, B2 extends OtherReturn, B3 extends OtherReturn, B4 extends LastReturn>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>
): EndpointResponse<B1 | B2 | B3 | B4>

function endpoint<
	B1 extends OtherReturn,
	B2 extends OtherReturn,
	B3 extends OtherReturn,
	B4 extends OtherReturn,
	B5 extends LastReturn
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>
): EndpointResponse<B1 | B2 | B3 | B4 | B5>

function endpoint<
	B1 extends OtherReturn,
	B2 extends OtherReturn,
	B3 extends OtherReturn,
	B4 extends OtherReturn,
	B5 extends OtherReturn,
	B6 extends LastReturn
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6>

function endpoint<
	B1 extends OtherReturn,
	B2 extends OtherReturn,
	B3 extends OtherReturn,
	B4 extends OtherReturn,
	B5 extends OtherReturn,
	B6 extends OtherReturn,
	B7 extends LastReturn
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

function endpoint<const Callbacks extends [...Callback<KitEvent, OtherReturn>[]]>(...callbacks: Callbacks) {
	return (event: KitEvent) => {
		let useProxy: ReturnType<typeof createEndpointProxy> | null = null

		async function endpointHandler() {
			// TODO Don't await an additional 2ms because of `.use` functionality.
			// TODO Consider a different approach.
			await new Promise((res) => setTimeout(res, 0))

			event.results ??= {}

			let prev: unknown
			for (const callback of callbacks) {
				let result: EndpointCallbackResult
				try {
					result = await callback(event)
				} catch (error) {
					if (error instanceof KitResponse) {
						result = error
					} else {
						throw error
					}
				}
				if (result instanceof KitResponse) return result
				if (result instanceof ParseKitEvent) {
					event.body = result.body
					event.query ??= {}
					Object.assign(event.query, result.query ?? {})
					continue
				}

				Object.assign(event.results!, result)
				prev = result
			}

			return prev
		}

		const promise = endpointHandler() as Promise<KitResponse>

		Object.assign(promise, {
			use(input?: { body?: unknown; query?: unknown }) {
				event.request ??= {} as typeof event.request
				event.request.json = () => new Promise((r) => r(input?.body))
				event.query ??= {}
				Object.assign(event.query, input?.query ?? {})

				// @ts-expect-error Assign to readable
				event.request.headers ??= new Headers()
				event.request.headers.set('content-type', 'application/json')

				useProxy ??= createEndpointProxy(promise)
				return useProxy
			}
		})

		return promise
	}
}

export { endpoint }
