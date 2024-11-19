import type { Handle, RequestEvent } from '@sveltejs/kit'
import type { KitResponse } from './http.ts'
import type { EndpointCallbackResult } from './endpoint.ts'
import type { Simplify, UnionToIntersection } from '../utils/types.ts'
import type { ZeroAPIServerOptions } from './hooks.ts'

export interface KitEvent<
	Input extends {
		body?: unknown
		query?: Record<string | number, any>
	} = any,
	Results = any
> extends RequestEvent {
	body: [Input['body']] extends [never] ? unknown : Input['body']
	query: [Input['query']] extends [never] ? Record<string | number, unknown> : Input['query']
	/**
	 * Returned content from previous callbacks in an endpoint;
	 * `App.Locals` little brother.
	 */
	results: [Results] extends [never] ? Record<PropertyKey, unknown> : Results
	zeroAPIOptions: ZeroAPIServerOptions
}

/**
 * A helper function to create a KitEvent from the results
 * of endpoint functions.
 */
export type KitEventFn<
	// note:  I wanted to omit keys from returned records
	//        that overlapped with previous ones. However,
	//        that may come at a later time as it seems "overcomplicative".
	R1 extends EndpointCallbackResult,
	R2 extends EndpointCallbackResult = never,
	R3 extends EndpointCallbackResult = never,
	R4 extends EndpointCallbackResult = never,
	R5 extends EndpointCallbackResult = never,
	R6 extends EndpointCallbackResult = never,
	R7 extends EndpointCallbackResult = never
> = KitEvent<
	Simplify<Pick<Extract<R1 | R2 | R3 | R4 | R5 | R6 | R7, ParseKitEvent<any, any>>, 'body' | 'query'>>,
	UnionToIntersection<
		Exclude<R1 | R2 | R3 | R4 | R5 | R6 | R7, KitResponse<any, any, any> | ParseKitEvent<any, any>>
	>
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
	body: [Body] extends [never] ? undefined : Body
	query: [Query] extends [never] ? undefined : Query
	constructor({ body, query }: { body?: Body; query?: Query }) {
		this.body = body! as any
		this.query = query! as any
	}
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

	params?: Record<PropertyKey, any>
	platform?: Record<PropertyKey, any>
	requestInit?: RequestInit
}

/**
 * Emulate a SvelteKit RequestEvent (ergo KitEvent) for testing.
 *
 * To check if currnetly processing a test event, you can do
 *
 * @example
 * if(event instanceof FakeKitEvent) {
 *     /// running a test
 * }
 */
export class FakeKitEvent implements KitEvent {
	body = {} as any
	query = {} as any
	fetch = fetch
	request = {} as any
	locals = {} as any
	getClientAddress = () => '127.0.0.1'
	isDataRequest = false
	isSubRequest = false
	params = {}
	platform = {}
	results = {}
	route = {} as any
	setHeaders = {} as any
	url = {} as any
	cookies = {} as any
	zeroAPIOptions = {}

	hooks: Handle | undefined

	constructor(options: FakeOptions = {}) {
		Object.assign(this, options)

		this.request = new Request(new URL('http://localhost:5173'), options.requestInit ?? {})

		// TODO
	}
}
