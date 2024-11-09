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

function endpoint<B1 extends KitResponse>(callback1: Callback<KitEvent, B1>): EndpointResponse<B1>

function endpoint<B1 extends CbResultType, B2 extends KitResponse>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>
): EndpointResponse<B1 | B2>

function endpoint<const Callbacks extends [...Callback<KitEvent, CbResultType>[]]>(...callbacks: Callbacks) {
	// * Return Proxy instead (ergo my belowed proxyCrawler)? Allowing ex. GET(event, { body, query }).OK(...)
	return async (event: KitEvent) => {
		let prev: unknown
		for (const callback of callbacks) {
			let result = await callback(event)
			if (result instanceof KitResponse) return result
			if (result instanceof ParseKitEvent) {
				event.body = result.body
				event.query = result.query ?? event.query
				continue
			}
			prev = result
		}
		return prev
	}
}

export { endpoint }
