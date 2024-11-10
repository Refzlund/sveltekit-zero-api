import z from 'zod'
import { BadRequest, OK } from './http.ts'
import { KitEvent, ParseKitEvent, FakeKitEvent } from './kitevent.ts'
import { endpoint } from './endpoint.ts'
import { Simplify } from '../utils/types.ts'
import { EndpointProxy, ReturnedEndpointProxy } from '../endpoint-proxy.ts'
import { expect } from '@std/expect'

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

	const POST = endpoint(
		zod({ body }),
		(event) => {
			return { previousFn: event.body }
		},
		(event) => {
			return new OK(event.results.previousFn)
		}
	)
	
	let bodyContent = Math.random() > 0.5 ? { name: 123 as any } : { name: 'Shiba💘' }
	let result = POST(new FakeKitEvent(), { body: bodyContent })
		.OK((r) => {})
		.BadRequest((r) => {})
		.success((r) => {
			console.log('success!🎉')
			console.log('body: ', r.body)
			console.log('')
		})
		.error((r) => console.log(r))

	function functionParamProxy(e: EndpointProxy) {
		if(e instanceof EndpointProxy) return
		throw new Error()
	}
	function functionParamReturnedProxy(e: ReturnedEndpointProxy) {
		if (e instanceof ReturnedEndpointProxy) return
		throw new Error()
	}

	// Is an Endpoint Proxy
	functionParamProxy(result)
	// @ts-expect-error Is not returned
	expect(() => functionParamReturnedProxy(result)).toThrow()
	
	// @ts-expect-error Is not a EndpointProxy
	expect(() => functionParamProxy({})).toThrow()

	let test: unknown = result

	console.log(`test/result (test instanceof EndpointProxy): `, test instanceof EndpointProxy)
	console.log(`test/result (test instanceof ReturnedEndpointProxy): `, test instanceof ReturnedEndpointProxy)
	console.log(`test: `, test)
	console.log()

	let continued = result.$
		.OK((r) => {
			
			return 123
		})
		.OK((r) => {
			if (Math.random() > 0.5) throw new Error('test')
			return 'yay' as const
		})
		.error((r) => r.body?.error)

	// @ts-expect-error cannot use $ twice
	expect(() => continued.$.error).toThrow()

	// @ts-expect-error Is indeed returned
	expect(() => functionParamProxy(continued)).toThrow()
	// Is an  Returned Endpoint Proxy
	functionParamReturnedProxy(continued)

	console.log(`continued (continued instanceof EndpointProxy): `, continued instanceof EndpointProxy)
	console.log(
		`continued (continued instanceof ReturnedEndpointProxy): `,
		continued instanceof ReturnedEndpointProxy
	)
	console.log(`continued: `, continued)
	console.log()
	console.log(`test/result (test instanceof ReturnedEndpointProxy): `, test instanceof ReturnedEndpointProxy)
	console.log()

	let first = continued[0]

	let [ok1, ok2, errorMsg] = continued

	let ok1promise = ok1.then((r) => {
		console.log('ok1 says: ' + r)
		return 'from then 1' as const
	})
	let ok2promise = ok2
		.then((r) => (r + '-2') as `${typeof r}-2`)
		.catch((e) => {
			console.log('ok2 has Failed:(')
			return 'from catch 2' as const
		})

	let awaited = await continued
	console.log('\nresult', awaited)

	let [
		awaited1,
		awaited2,
		awaited3,
		/** @ts-expect-error Expect awited to contain 3 items */
		awaited4
	] = awaited

	let awaitedok1 = await ok1promise
	console.log('ok1promise:', awaitedok1)

	let awaitedok2 = await ok2promise
	console.log('ok2promise:', awaitedok2)
})
