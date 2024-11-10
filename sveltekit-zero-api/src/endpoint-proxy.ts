import { KitResponse } from "./server/http.ts";
import { proxyCrawl } from "./utils/proxy-crawl.ts";
import type { EndpointProxy as EndpointProxyType } from "./server/endpoint.ts"

type Res = KitResponse | Response


async function callCallback(result: Res, statusText: string, cb: (response: Res) => any) {
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

export class EndpointProxy {
	constructor() {
		throw new Error('Cannot construct EndpointProxy. Please use `createEndpointProxy` instead.')
	}
}

export interface EndpointProxy extends EndpointProxyType<any> {}

export function createEndpointProxy(response: Promise<KitResponse | Response>) {
	// Proxy
	// ex. `let [result] = GET(event, { body: { ... }}).error(...).$.OK(...)`

	/** Callbacks */
	let cbs: [string, (response: Res) => any][] = []
	let $cbs: [string, (response: Res) => any][] = []

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

	function handleResponsePromise(response: Res) {
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

	return proxyCrawl({
		getPrototypeOf() {
			return EndpointProxy.prototype
		},
		get(state) {
			if (state.key === Symbol.iterator) {
				return $results[Symbol.iterator].bind($results)
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
				if ($cbs.length) {
					str += `  $: [${$cbs.map((v) => v[0]).join(', ')}]`
				}
				return str
			}

			let crawler = state.crawl([])

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
	})
}