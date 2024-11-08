import z from 'zod'
import { BadRequest } from './http.ts'
import { KitEvent, ParseKitEvent } from './kitevent.ts'
import { endpoint } from "./endpoint.ts";

function zod<
	Body extends z.ZodTypeAny = never,
	Query extends z.ZodTypeAny = never
>({ body, query }: { body?: Body, query?: Query }) {
	return async (event: KitEvent) => {
		let json: Record<PropertyKey, any> | Array<any>

		try {
			json = await event.request.json()
		} catch (error) {
			return new BadRequest({
				code: 'invalid_json',
				error: 'Invalid JSON'
			})
		}

		const bodyResult = body?.safeParse(json)
		if (bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: bodyResult.error
			})
		}

		const queryResult = query?.safeParse(event.query)
		if (queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: queryResult.error
			})
		}

		return new ParseKitEvent<z.output<Body>, z.output<Query>>({ 
			body: bodyResult?.data, 
			query: queryResult?.data
		})
	}
}

Deno.test('kitevent', async () => {

	const body = z.object({ name: z.string() })

	const result = await endpoint(
		zod({ body }),
		event => {

		}
	)

})