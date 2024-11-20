import { browser } from '$app/environment'
import { createEndpointProxy } from '../endpoint-proxy.ts'
import { proxyCrawl } from '../utils/proxy-crawl.ts'
import { complexSlug } from '../utils/slugs.ts'

interface APIProxyOptions {
	/**
	 * Where to fetch from. When `undefined`; the current site.
	 * @default undefined
	 */
	url?: string | URL
}

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export function createAPIProxy<T>(options: APIProxyOptions = {}) {
	return proxyCrawl({
		apply(state) {
			let key = state.key.toString()
			if (key.endsWith('$')) {
				// * Slugged route

				let m: RegExpMatchArray | null
				if (key.startsWith('$')) {
					// "$slug$": (slug?: string | undefined | null)
					return state.crawl(state.args[0])
				}
				if (key.endsWith('$$')) {
					// "rest$$": (...rest: string[])
					if (state.args[0] === undefined) {
						throw new Error('Cannot slug the lack of rest parameters', { cause: state })
					}
					return state.crawl(state.args)
				}
				if ((m = key.match(complexSlug))) {
					//"[a]-[b]$": (a: string, b: string)
					let result = ''

					let k = key
					let i = 0
					do {
						result += k.slice(0, m.index!)

						if (state.args[i] === undefined) {
							throw new Error('Not enough paramters for complex slug', {
								cause: {
									state,
									result,
									argCount: state.args.length,
									slug: key,
									expected: Array.from(key.matchAll(complexSlug)).length
								}
							})
						}

						result += state.args[i]
						k = k.slice(m[0].length + m.index!)
						i++
					} while ((m = k.match(complexSlug)))
					result += k.slice(0, -1)

					return state.crawl(result) // ex. `shiba-giraffe`
				}

				// "slug$": (slug: string)
				if (state.args[0] === undefined) {
					throw new Error('Cannot slug undefined', { cause: state })
				}
				return state.crawl(state.args[0])
			}

			if (!browser) {
				// Only browser/client can make fetch requests.
				// On the server utilize the `.use` functionality.
				return state.crawl([])
			}

			// * Both functions and normal API calls requests a response.

			const xhr = key === 'xhr' ? new XMLHttpRequest() : undefined

			let searchParams: URLSearchParams | undefined | false
			const route = xhr ? state.keys.slice(0, -1).join('/') : state.keys.join('/')

			let isMethod = xhr || methods.includes(key)

			let method = isMethod ? (xhr ? state.keys[state.keys.length - 1].toString() : key) : 'PATCH' // functions always use PATCH
			if (!methods.includes(method)) {
				throw new Error('Invalid method: ' + method, { cause: state })
			}

			type BodyType = null | undefined | ReadableStream | FormData | object | string
			let body: BodyType | Array<unknown> = isMethod
				? state.args[0]
				: state.args.length === 1
				? state.args[0]
				: state.args

			let requestInit: RequestInit & { query?: Record<string, any> } = isMethod ? state.args[1] || {} : {}

			let headers = new Headers(requestInit?.headers)
			headers.append('x-requested-with', 'sveltekit-zero-api')

			if (key === 'GET' && !headers.has('cache-control'))
				headers.append('cache-control', 'public, max-age=604800, immutable')

			if (body !== null && body !== undefined && !headers.has('content-type')) {
				if (body instanceof ReadableStream) {
					// https://caniuse.com/mdn-api_request_duplex - largely unsupported still
					// headers.set('content-type', 'application/octet-stream')
					throw new Error(
						'Streaming data is largely unsupported in browsers, as Request Duplex is required. See ' +
							'https://caniuse.com/mdn-api_request_duplex'
					)
				} else if (body instanceof FormData) {
					// https://stackoverflow.com/a/49510941 - fetch sets content-type automatically incl. form boundary
					// headers.set('content-type', 'multipart/form-data')
				} else if (
					typeof body === 'object' ||
					typeof body === 'string' ||
					typeof body === 'number' ||
					typeof body === 'boolean'
				) {
					headers.set('content-type', 'application/json')
					body = JSON.stringify(body)
				}
			}

			if (isMethod) {
				searchParams = 'query' in requestInit && new URLSearchParams(requestInit.query)
			} else {
				headers.append('x-function', key)
			}

			const url =
				options.url?.toString() || '/' + route + (searchParams ? '?' + searchParams.toString() : '')

			// ('query' in requestInit ? '?' + new URLSearchParams(requestInit.query).toString() : '')
			let response =
				!xhr &&
				fetch(
					url,
					// avoid making the "preflight http request", which will make it twice as fast
					method === 'GET'
						? undefined
						: {
								...requestInit,
								body: (body === null ? undefined : body) as BodyInit,
								headers,
								method
						  }
				)

			if (isMethod && xhr) {
				// Use XHR

				let xhrResolve: (response: Response) => void
				response = new Promise((resolve, reject) => {
					xhrResolve = resolve
				})

				setTimeout(() => {
					xhr.dispatchEvent(new CustomEvent('init'))

					xhr.open(method, url, true)

					for (const [key, value] of headers) {
						xhr.setRequestHeader(key, value)
					}

					function onloadend() {
						const headers = new Headers()
						xhr!
							.getAllResponseHeaders()
							.trim()
							.split(/[\r\n]+/)
							.forEach((line) => {
								const parts = line.split(': ')
								const header = parts.shift()
								const value = parts.join(': ')
								if (header) headers.append(header, value)
							})

						xhrResolve(
							new Response(xhr!.response, {
								status: xhr!.status,
								statusText: xhr!.statusText,
								headers
							})
						)
					}

					xhr.addEventListener('loadend', onloadend)

					xhr.send(body as XMLHttpRequestBodyInit | Document | null | undefined)
				}, 0)
			}

			if (response === false) throw new Error('Response was not created correctly') // type narrowing

			response = response
				.then(async (res) => {
					if (res.headers.get('content-type')?.includes('application/json')) {
						let body = await res.json()
						Object.defineProperty(res, 'body', {
							get() {
								return body
							}
						})
					}
					return res
				})
				.catch(async (res) => {
					if (!('headers' in res)) throw res
					if (res.headers.get('content-type')?.includes('application/json')) {
						let body = await res.json()
						Object.defineProperty(res, 'body', {
							get() {
								return body
							}
						})
					}
					return res as Response
				})

			if (isMethod) {
				return createEndpointProxy(response, xhr)
			}

			return new Promise((resolve, reject) => {
				response
					.then((res) => {
						if (!res.ok) {
							return reject(res)
						}
						resolve(res.body)
					})
					.catch(reject)
			})
		}
	}) as T
}
