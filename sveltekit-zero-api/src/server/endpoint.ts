import { AwaitAll, Promisify } from './../utils/types.ts'
import { createEndpointProxy } from '../endpoint-proxy.ts'
import { FixKeys, Simplify } from '../utils/types.ts'
import { KitResponse, StatusCode, Statuses, StatusTextType } from './http.ts'
import { KitEvent, KitEventFn, ParseKitEvent } from './kitevent.ts'
import { EndpointProxy } from '../endpoint-proxy.type.ts'

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
	(event: KitEvent): Promise<Extract<Results, KitResponse>>

	// on frontend we grab the second parameter Input-type, for zeroapi
	(event: KitEvent, input: EndpointInput<Results>): EndpointProxy<Extract<Results, KitResponse>>
}

// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint overloads

function endpoint<B1 extends KitResponse>(callback1: Callback<KitEvent, B1>): EndpointResponse<B1>

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
	return (event: KitEvent, input?: { body?: unknown; query?: unknown }) => {
		async function endpointHandler() {
			event.results ??= {}

			if (input) {
				event.request ??= {} as typeof event.request
				event.request.json = () => new Promise((r) => r(input.body))
				event.query ??= {}
				Object.assign(event.query, input.query ?? {})

				// @ts-expect-error Assign to readable
				event.request.headers ??= new Headers()
				event.request.headers.set('content-type', 'application/json')
			}

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
		if (!input) {
			// End early to avoid adding additional logic for every request.
			return promise
		}

		return createEndpointProxy(promise)
	}
}

export { endpoint }
