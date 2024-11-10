import { callCallback } from "../callbacks.ts";
import { proxyCrawl } from '../utils/proxy-crawl.ts'
import { FixKeys, Simplify } from '../utils/types.ts'
import { KitResponse, OK, StatusCode } from './http.ts'
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
type EndpointProxy<Results extends KitResponse> = Promise<Results> & {
	// [K in (Results extends KitResponse<infer A, infer B, infer C> ? B : never)]:
	// 	(cb: (response: Results extends KitResponse<A, B> ? Results : never) => void) => EndpointProxy<Results>
} & {
	informational: (
		cb: (
			response: Results extends KitResponse<StatusCode['Informational'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
	success: (
		cb: (
			response: Results extends KitResponse<StatusCode['Success'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
	redirect: (
		cb: (
			response: Results extends KitResponse<StatusCode['Redirect'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
	clientError: (
		cb: (
			response: Results extends KitResponse<StatusCode['ClientError'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
	serverError: (
		cb: (
			response: Results extends KitResponse<StatusCode['ServerError'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
	error: (
		cb: (
			response: Results extends KitResponse<StatusCode['Error'], infer B, infer C> ? Results : never
		) => void
	) => EndpointProxy<Results>
}

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
	(event: KitEvent, input: EndpointInput<Results>): EndpointProxy<Extract<Results, KitResponse>>
}

// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint overloads

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

function endpoint<
	B1 extends CbResultType,
	B2 extends CbResultType,
	B3 extends CbResultType,
	B4 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>
): EndpointResponse<B1 | B2 | B3 | B4>

function endpoint<
	B1 extends CbResultType,
	B2 extends CbResultType,
	B3 extends CbResultType,
	B4 extends CbResultType,
	B5 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>
): EndpointResponse<B1 | B2 | B3 | B4 | B5>

function endpoint<
	B1 extends CbResultType,
	B2 extends CbResultType,
	B3 extends CbResultType,
	B4 extends CbResultType,
	B5 extends CbResultType,
	B6 extends KitResponse
>(
	callback1: Callback<KitEvent, B1>,
	callback2: Callback<KitEventFn<B1>, B2>,
	callback3: Callback<KitEventFn<B1, B2>, B3>,
	callback4: Callback<KitEventFn<B1, B2, B3>, B4>,
	callback5: Callback<KitEventFn<B1, B2, B3, B4>, B5>,
	callback6: Callback<KitEventFn<B1, B2, B3, B4, B5>, B6>
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6>

function endpoint<
	B1 extends CbResultType,
	B2 extends CbResultType,
	B3 extends CbResultType,
	B4 extends CbResultType,
	B5 extends CbResultType,
	B6 extends CbResultType,
	B7 extends KitResponse
>(
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
	return (event: KitEvent, input?: { body?: unknown; query?: unknown }) => {
		async function endpointHandler() {
			event.results ??= {}

			if (input) {
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
					event.query ??= {}
					Object.assign(event.query, result.query ?? {})
					continue
				}

				Object.assign(event.results!, result)
				prev = result
			}

			return prev
		}

		const promise = endpointHandler() as Promise<KitResponse>
		if (!input) {
			// End early to avoid adding additional logic for every request.
			return promise
		}

		// Proxy
		// ex. `let [result] = GET(event, { body: { ... }}).error(...).$.OK(...)`

		/** Callbacks */
		let cbs: [string, (response: KitResponse) => any][] = []
		let $cbs: [string, (response: KitResponse) => any][] = []

		let $results: Promise<unknown | undefined>[] = []
		/** `resolve(...)` function associated with $results promise */
		let $resolvers: {
			resolve: (value: unknown) => void
			reject: (reason?: any) => void
		}[] = []

		let resolve: (value: unknown) => void
		const responsePromise = new Promise((res) => {
			resolve = res
		})

		function handleResponsePromise(response: KitResponse) {
			setTimeout(async () => {
				for (const cb of cbs) {
					await callCallback(response, cb[0], cb[1])
				}

				if ($cbs.length) {
					let allResolved: (value: unknown) => void
					let allResults = Array($cbs.length)
					let allPromise = new Promise((resolve) => {
						allResolved = resolve
					})
					let resolved = 0

					for (let i = 0; i < $cbs.length; i++) {
						let $cb = $cbs[i]
						callCallback(response, $cb[0], $cb[1])
							.then((result) => {
								allResults[i] = result
								$resolvers[i].resolve(result)
								resolved++
								if (resolved === $cbs.length) {
									allResolved(allResults)
								}
							})
							.catch((err) => {
								allResults[i] = undefined
								$resolvers[i].reject(err)
								resolved++
								if (resolved === $cbs.length) {
									allResolved(allResults)
								}
							})
					}

					await allPromise
					resolve(allResults) // -> const [fulfilledOK, fulfilledError] = await GET(...).$...
					return
				}
				resolve(response)
			}, 0)
		}

		promise.then(handleResponsePromise).catch(handleResponsePromise)

		return proxyCrawl({
			get(state) {
				if(state.key === Symbol.iterator) {
					return $results[Symbol.iterator].bind($results)
				}

				if(typeof state.key !== 'symbol') {
					let index = Number(state.key)
					if (!isNaN(index)) {
						return $results[index] // -> const [promiseOK, promiseError] = GET(...).$...
					}
				}
				
				return state.crawl(state.key)
			},
			apply(state) {
				if (state.key === 'then')
					return responsePromise.then.apply(responsePromise, state.args as [])
				if (state.key === 'catch')
					return responsePromise.catch.apply(responsePromise, state.args as [])
				if (state.key === 'finally')
					return responsePromise.finally.apply(responsePromise, state.args as [])

				if (state.key === Symbol.toPrimitive) {
					let str = 'EndpointProxy' + ((cbs.length || $cbs.length) ? ': ' : '')
					if(cbs.length)
						str += `[${cbs.map((v) => v[0]).join(', ')}]`
					if($cbs.length) {
						str += `   $: [${$cbs.map((v) => v[0]).join(', ')}]`
					}
					return str
				}

				let crawler = state.crawl([])

				if (state.keys[0] === '$') {
					$cbs.push([state.key as string, state.args[0]])
					
					let $resolve: ((value: unknown) => void)
					let $reject: ((value: unknown) => void)
					let $promise = new Promise((resolve, reject) => {
						$resolve = resolve
						$reject = reject
					})

					$results.push($promise)
					$resolvers.push({
						resolve: $resolve!,
						reject: $reject!
					})
				} else {
					cbs.push([state.key as string, state.args[0]])
				}

				return crawler
			}
		})
	}
}

export { endpoint }
