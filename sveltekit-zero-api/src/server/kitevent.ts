import { RequestEvent } from "@sveltejs/kit"

export interface KitEvent<Body = unknown, Query = Record<string | number, any>> extends RequestEvent {
	body: Body
	query: Query
}

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
	static queryParse(event: KitEvent): Record<string | number, any> {
		return {}
	}
}