import z from 'zod'
import { BadRequest, OK } from './http.ts'
import { KitEvent, ParseKitEvent, FakeKitEvent } from './kitevent.ts'
import { endpoint } from './endpoint.ts'
import { Simplify } from "../utils/types.ts";

function zod<Body extends z.ZodTypeAny = never, Query extends z.ZodTypeAny = never>({
	body,
	query
}: {
	body?: Body
	query?: Query
}) {
	return async (event: KitEvent<any, any>) => {
		let json: Record<PropertyKey, any> | Array<any>

		let contentTypes = ['application/json', 'multipart/form-data'] as const
		let contentType = event.request.headers.get('content-type')?.toLowerCase() as (typeof contentTypes)[number]

		if (!contentType || !contentTypes.includes(contentType)) {
			return new BadRequest({
				code: 'bad_content_type',
				error: 'Bad Content-Type header',
				details: {
					expected: contentTypes,
					received: (contentType as string) || 'undefined'
				}
			})
		}

		if (contentType == 'multipart/form-data') {
			try {
				const formData = await event.request.formData()
				json = Object.fromEntries(formData)
			} catch (error) {
				return new BadRequest({
					code: 'invalid_formdata',
					error: 'Could not parse FormData',
					details: error
				})
			}
		} else {
			try {
				json = await event.request.json()
			} catch (error) {
				return new BadRequest({
					code: 'invalid_json',
					error: 'Could not parse JSON',
					details: error
				})
			}
		}

		const bodyResult = body?.safeParse(json)
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

Deno.test('kitevent', async () => {

	const body = z.object({
		name: z.string().optional()
	})

	let v = zod({ body })
	type T = Extract<Awaited<ReturnType<typeof v>>, ParseKitEvent<any, any>>

	const fn = endpoint(
		zod({ body }),
		(event) => {
			return { previousFn: event.body }
		},
		(event) => {
			return new OK(event.results.previousFn)
		}
	)

	let bodyContent = Math.random() > 0.5 ? { name: 123 as any } : { name: 'Shiba💘' }
	const result = fn(new FakeKitEvent(), { body: bodyContent })
		.OK((r) => {})
		.BadRequest((r) => {})
		.success((r) => {
			console.log('success!🎉')
			console.log('body: ', r.body)
			console.log('')
		})
		.error((r) => console.log(r))
		.$.OK((r) => {
			return 123
		})
		.OK((r) => {
			if (Math.random() > 0.5) throw new Error('test')
			return 'yay' as const
		})

	type R = Simplify<typeof result>

	console.log(result)
	console.log('')
	let first = result[0]

	let [ok1, ok2, ok3] = result
	let ok1promise = ok1.then((r) => {
		console.log('ok1 says: ' + r)
		return 'from then 1' as const
	})
	let ok2promise = ok2.then(r => (r + '-2') as `${typeof r}-2`).catch((e) => {
		console.log('ok2 has Failed:(')
		return 'from catch 2' as const
	})

	let awaited = await result
	console.log('\nresult', awaited)

	let awaitedok1 = await ok1promise
	console.log('ok1promise:', awaitedok1)

	let awaitedok2 = await ok2promise
	console.log('ok2promise:', awaitedok2)
})
