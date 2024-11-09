import { Handle, RequestEvent } from "@sveltejs/kit"
import { KitResponse } from "./http.ts";
import { CbResultType } from "./endpoint.ts";

export interface KitEvent<
	Input extends {
		body?: unknown
		query?: Record<string | number, any>
	} = never,
	Results = Record<PropertyKey, unknown>
> extends RequestEvent {
	body: [Input['body']] extends [never] ? unknown : Input['body']
	query: [Input['query']] extends [never] ? Record<string | number, unknown> : Input['query']
	/**
	 * Returned content from previous callbacks in an endpoint;  
	 * `App.Locals` little brother.
	*/
	results: [Results] extends [never] ? Record<PropertyKey, unknown> : Results
}

/**
 * A helper function to create a KitEvent from the results
 * of endpoint functions.
*/
export type KitEventFn<
	Results extends CbResultType
> = KitEvent<
	Pick<Extract<Results, ParseKitEvent<any, any>>, 'body' | 'query'>,
	Exclude<Results, KitResponse<any, any, any> | ParseKitEvent<any, any>>
> extends KitEvent<infer A, infer B>
	? KitEvent<A, B>
	: never

/**
 * Provides the `body` and `query` properties from the `KitEvent` with types
 * 
 * @example
```ts
import {
	type KitEvent,
	ParseKitEvent
} from 'sveltekit-zero-api'

function zod({ body, query }) {
	return async (event: KitEvent) => {
		let json

		try {
			json = await event.request.json()
		} catch (error) {
			return new BadRequest({
				code: 'invalid_json',
				error: 'Invalid JSON'
			})
		}
		const [bodyResult, queryResult] = [
			body && body.safeParse(json),
			query && query.safeParse(
				ParseKitEvent.queryParse(event)
			)
		]
		
		if(bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: bodyResult.error
			})
		}

		if(queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: queryResult.error
			})
		}

		return new ParseKitEvent({ body: bodyResult.data, query: queryResult.data })
	}
}

```
*/
export class ParseKitEvent<Body = never, Query = never> {
	body: Body
	query: Query
	constructor({ body, query }: { body?: Body, query?: Query }) {
		this.body = body!
		this.query = query!
	}

	/** Parses query into a Record */
	// TODO automatically do queryParse in hooks
	// static queryParse(event: KitEvent): Record<string | number, any> {
	// 	return {}
	// }
}


interface FakeOptions {
	/**
	 * Provide your server hooks.
	 *
	 * Remember to [Sanitize](https://docs.deno.com/runtime/fundamentals/testing/#resource-sanitizer)
	 * after your tests, like closing database-connections.
	*/
	hooks?: Handle
	/** Pre-fill locals, e.g. `isTest: true` */
	locals?: Record<PropertyKey, any>
}

/**
 * Emulate a SvelteKit RequestEvent (ergo KitEvent) 
 * for testing.
*/
export function fakeKitEvent(options: FakeOptions = {}) {
	return {} as KitEvent
}