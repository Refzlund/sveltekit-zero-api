import { KitResponse } from "./http.ts";
import { KitEvent, ParseKitEvent } from './kitevent.ts'

interface Callback<Event = KitEvent, Result = unknown> {
	(event: Event): Result
}

interface EndpointResponse<Input extends { body?: unknown, query?: unknown }> {
	(event: KitEvent): Promise<unknown> // Returns a more immediate KitResponse | BX
	(event: KitEvent, input: Input): Promise<unknown> // Returns proxy
	// on frontend we grab the second parameter Input-type, for zeroapi

}

function endpoint<
	B1 extends Record<PropertyKey, any> | KitResponse | ParseKitEvent
>(
	callback1: Callback<KitEvent, B1>,
): (event: KitEvent) => Promise<B1>

function endpoint<
	B1, B2
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEvent, B2>,
): (event: KitEvent) => Promise<B1 | B2>

function endpoint<const Callbacks extends [...Callback[]]>(
	...callbacks: Callbacks
) {
	// * Return Proxy instead? Allowing ex. GET(event, { body, query }).OK(...)
	return async (event: KitEvent) => {
		let prev: unknown
		for (const callback of callbacks) {
			let result = await callback(event)
			if(result instanceof KitResponse)
				return result
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

const result = endpoint(
	(e) => {
		return { n: 123 } as const
	}
)

export { endpoint }