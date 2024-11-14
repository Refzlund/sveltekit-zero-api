import { Generic } from './../server/functions'
import { expect } from '@std/expect'
import { endpoint } from '../server/endpoint.ts'
import { BadRequest, KitResponse, OK } from '../server/http.ts'
import { FakeKitEvent, KitEvent, ParseKitEvent } from '../server/kitevent.ts'
import { parseJSON } from '../server/parse-json.ts'
import z from 'zod'

function zod<Body extends z.ZodTypeAny = never, Query extends z.ZodTypeAny = never>({
	body,
	query
}: {
	body?: Body
	query?: Query
}) {
	return async (event: KitEvent<any, any>) => {
		let result = await parseJSON(event)

		if (result instanceof KitResponse) return result

		const bodyResult = body?.safeParse(result.body)
		if (bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: 'Invalid body schema',
				details: bodyResult.error
			})
		}

		const queryResult = query?.safeParse(event.query)
		if (queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: 'Invalid query schema',
				details: queryResult.error
			})
		}

		return new ParseKitEvent<z.output<Body>, z.output<Query>>({
			body: bodyResult?.data,
			query: queryResult?.data
		})
	}
}

Deno.test('Generic endpoint', async () => {
	const POST = endpoint(
		parseJSON, // -> event.body
		(event) =>
			new Generic(<Body, Query>(body: Body, options: { query: Query }) => {
				return {
					body
				}
			}),
		(event) => {
			return new OK(event.results.body)
		}
	)

	/*
		endpont(
			event => generic(<T>(input: T) => {
				return someFn(event, input)
			})
		)
	
	*/
})

Deno.test('endpoint ParseKitEvent', async () => {
	const body = z.object({
		name: z.string().optional()
	})

	const POST = endpoint(
		zod({ body }),
		(event) => {
			return { previousFn: event.body }
		},
		(event) => {
			return new OK(event.results.previousFn)
		}
	)

	let ran = 0

	// @ts-expect-error name must be string
	let r1 = POST(new FakeKitEvent())
		.use({ body: { name: 123 } })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success(() => '')

	let [badRequest] = r1

	await expect(badRequest).resolves.rejects.toThrow('Failed validation')

	let r2 = POST(new FakeKitEvent())
		.use({ body: { name: 'John' } })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success((r) => r.body)[1]

	let success = await r2
	expect(success).toEqual({ name: 'John' })

	expect(ran).toBe(2)
})
