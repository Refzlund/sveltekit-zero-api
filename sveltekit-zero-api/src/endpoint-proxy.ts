import { KitResponse } from "./server/http.ts";
import { proxyCrawl } from "./utils/proxy-crawl.ts";
import type { EndpointProxy as EndpointProxyType } from "./endpoint-proxy.type.ts"


/**
 * e.g. Responses from endpoints
 */
export class EndpointProxy {
	constructor() {
		throw new Error('Cannot construct EndpointProxy. Please use `createEndpointProxy` instead.')
	}
}
export interface EndpointProxy extends EndpointProxyType<KitResponse<any, any, any, boolean>, never> {}

/**
 * An EndpointProxy that has marked a `.$.` to return an array of promised callbacks.
*/
export class ReturnedEndpointProxy {
	constructor() {
		throw new Error('Cannot construct ReturnedEndpointProxy. Please use `createEndpointProxy` and use `.$` instead.')
	}
}
export interface ReturnedEndpointProxy extends EndpointProxyType<KitResponse<any, any, any, boolean>, any[]> {}


type ResponseType = KitResponse | Response

/** @note In order to get correct types, the response should be `Promise<KitResponse>` */
export function createEndpointProxy<T extends KitResponse>(response: Promise<T | Response>): EndpointProxyType<T, never> {
	// Proxy
	// ex. `let [result] = GET(event, { body: { ... }}).error(...).$.OK(...)`

	/** Callbacks */
	let cbs: [string, (response: ResponseType) => any][] = []
	let $cbs: [string, (response: ResponseType) => any][] = []

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

	function handleResponsePromise(response: ResponseType) {
		setTimeout(async () => {
			for (const cb of cbs) {
				await callCallback(response, cb[0], cb[1])
			}

			if (!$cbs.length) {
				return resolve(response)
			}

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
		}, 0)
	}

	response.then(handleResponsePromise).catch(handleResponsePromise)

	/*
		TODO
			Add a "props" to the state, defined by <T> in proxyCrawl<T>
			which is an accessor for each separate "crawl"

			All non .$. (returned) will resolve with KitResponse

			All .$. will resolve with [...Promise<any>[]] which is a prop.
			When a callback is made to a .$.'ed chain, it will take the previous' (parent) prop
			with promises, and create a new one with it self appended, e.g.

			state.props.$ = [...state.parentProps.$, new Promise(...)]
	*/

	return proxyCrawl({
		getPrototypeOf(state) {
			if (state.keys[0] === '$') return ReturnedEndpointProxy.prototype
			return EndpointProxy.prototype
		},
		get(state) {
			if (state.key === Symbol.iterator) {
				return $results[Symbol.iterator].bind($results)
			}

			if(state.key === '$' && state.keys.includes(state.key)) {
				throw new Error('.$. cannot be used multiple times.', {
					cause: {
						state,
						cbs: cbs.map(v => v[0]),
						$cbs: $cbs.map(v => v[0])
					}
				})
			}

			if (typeof state.key !== 'symbol') {
				let index = Number(state.key)
				if (!isNaN(index)) {
					return $results[index] // -> const [promiseOK, promiseError] = GET(...).$...
				}
			}

			return state.crawl(state.key)
		},
		apply(state) {
			if (state.key === 'then') return responsePromise.then.apply(responsePromise, state.args as [])
			if (state.key === 'catch') return responsePromise.catch.apply(responsePromise, state.args as [])
			if (state.key === 'finally') return responsePromise.finally.apply(responsePromise, state.args as [])

			if (state.key === Symbol.toPrimitive) {
				let str = 'EndpointProxy' + (cbs.length || $cbs.length ? ':' : '')
				if (cbs.length) str += ` [${cbs.map((v) => v[0]).join(', ')}]`
				if (state.keys[0] === '$') {
					str += `  $: [${$cbs.map((v) => v[0]).join(', ')}]`
				}
				return str
			}

			let crawler = state.crawl([])

			if(typeof state.args[0] !== 'function') {
				throw new Error('Callback must be a function', { cause: state })
			}

			if (state.keys[0] === '$') {
				$cbs.push([state.key as string, state.args[0]])

				let $resolve: (value: unknown) => void
				let $reject: (value: unknown) => void
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
	}) as any
}


async function callCallback(result: ResponseType, statusText: string, cb: (response: ResponseType) => any) {
	if (statusText === result.statusText) {
		return await cb(result)
	}
	if (result.status >= 100 && result.status < 200 && statusText === 'informational') {
		return await cb(result)
	}
	if (result.status >= 200 && result.status < 300 && statusText === 'success') {
		return await cb(result)
	}
	if (result.status >= 300 && result.status < 400 && statusText === 'redirect') {
		return await cb(result)
	}
	if (result.status >= 400 && result.status < 500 && statusText === 'clientError') {
		return await cb(result)
	}
	if (result.status >= 500 && result.status < 600 && statusText === 'serverError') {
		return await cb(result)
	}
	if (result.status >= 400 && result.status < 600 && statusText === 'error') {
		return await cb(result)
	}
}