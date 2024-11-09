import { FixKeys, Simplify } from '../utils/types.ts'
import { KitResponse, OK } from './http.ts'
import { KitEvent, KitEventFn, ParseKitEvent } from './kitevent.ts'

/**
 * The "result" of an `endpoint` paramters `callback`
*/
export type CbResultType = Record<PropertyKey, any> | KitResponse | ParseKitEvent

/**
 * A callback function for an `endpoint` parameter.
*/
interface Callback<Event extends KitEvent<any, any>, Result extends CbResultType> {
	(event: Event): Promise<Result> | Result
}

/**
 * An `EndpointResponse` return type, that can be proxy-crawled
 * to do `.OK(...).$.error(...)` etc.
 * 
 * This should work the same on frontend and backend.
*/
type EndpointProxy = Promise<unknown> & { _ } // TODO

/**
 * The input for an endpoint.
*/
type EndpointInput<Results extends CbResultType> = Simplify<
	FixKeys<Pick<Extract<Results, ParseKitEvent<any, any>>, 'body' | 'query'>>
>

/**
 * The return-type for an `endpoint`.
*/
interface EndpointResponse<Results extends CbResultType> {
	(event: KitEvent): Promise<Extract<Results, KitResponse>>

	// on frontend we grab the second parameter Input-type, for zeroapi
	(event: KitEvent, input: EndpointInput<Results>): EndpointProxy
}



// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint

function endpoint<B1 extends KitResponse>(callback1: Callback<KitEvent, B1>): EndpointResponse<B1>

function endpoint<B1 extends CbResultType, B2 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>
): EndpointResponse<B1 | B2>

function endpoint<B1 extends CbResultType, B2 extends CbResultType, B3 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>
): EndpointResponse<B1 | B2 | B3>

function endpoint<B1 extends CbResultType, B2 extends CbResultType, B3 extends CbResultType, B4 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>
): EndpointResponse<B1 | B2 | B3 | B4>

function endpoint<B1 extends CbResultType, B2 extends CbResultType, B3 extends CbResultType, B4 extends CbResultType, B5 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>
): EndpointResponse<B1 | B2 | B3 | B4 | B5>

function endpoint<B1 extends CbResultType, B2 extends CbResultType, B3 extends CbResultType, B4 extends CbResultType, B5 extends CbResultType, B6 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6>

function endpoint<B1 extends CbResultType, B2 extends CbResultType, B3 extends CbResultType, B4 extends CbResultType, B5 extends CbResultType, B6 extends CbResultType, B7 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>,
	callback7: Callback<KitEventFn<B1, B2, B3, B4, B5, B6>, B7>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6 | B7>

// #endregion



function endpoint<const Callbacks extends [...Callback<KitEvent, CbResultType>[]]>(...callbacks: Callbacks) {
	// * Return Proxy instead (ergo my belowed proxyCrawler)? Allowing ex. GET(event, { body, query }).OK(...)
	return async (event: KitEvent, input?: { body?: unknown, query?: unknown }) => {
		event.results ??= {}

		if(input) {
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
			let result = await callback(event)
			if (result instanceof KitResponse) return result
			if (result instanceof ParseKitEvent) {
				event.body = result.body
				event.query = result.query ?? event.query
				continue
			}
			
			Object.assign(event.results, result)
			prev = result
		}
		return prev
	}
}

export { endpoint }
