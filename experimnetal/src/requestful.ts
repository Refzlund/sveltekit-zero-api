/*

    new Requestful('api/some/example', {
        method: 'POST',
        fetch: false // default is false
    })

    const api = new RequestAPI<APISchema>({
        base: '/api/',
		options: {
			GET: {
				headers: {
					'cache-control': 'public, max-age=604800, immutable'
				}
			}
		}
    })
    api.some.example.GET()
*/

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

interface XHRRequestOptions {
	method: RequestMethod
	headers?: Record<string, string>
	body?: string | FormData | Blob | ArrayBuffer | Array<unknown> | Record<PropertyKey, unknown>
	progress?: (progress: ProgressEvent) => void
	query?: Record<string, string | number | boolean>
}

type MaybeArray <T> = T | Array<T>

type FetchOptions = NonNullable<Parameters<Fetch>[1]>
interface FetchRequestOptions extends FetchOptions {
	method: RequestMethod
	fetch: Fetch
	query?: Record<string, MaybeArray<string | number | boolean>>
}

type RequestOptions = XHRRequestOptions | FetchRequestOptions

export class Requestful {
	response: Promise<Response>
	aborted = false

	#xhr: XMLHttpRequest | null = null

	abort() {
		if (this.#abortcontroller) {
			this.#abortcontroller.abort()
			this.#abortcontroller = null
		} else if (this.#xhr) {
			this.#xhr.abort()
		}
		this.aborted = true
	}

	#abortcontroller: AbortController | null = null
	#url: URL
	#options: RequestOptions
	#body?: BodyInit
	get #fetchopts() {
		return this.#options as FetchRequestOptions
	}
	get #xhropts() {
		return this.#options as XHRRequestOptions
	}

	constructor(url: string | URL, options: RequestOptions = { method: 'GET' }) {
		this.#url = url instanceof URL ? url : new URL(url)

		const params = new URLSearchParams(this.#url.search)
		for(const [key, value] of Object.entries(options.query || {})) {
			if (Array.isArray(value)) {
				for (const v of value) {
					params.append(key, String(v))
				}
			}
			else if (value !== undefined) {
				params.append(key, String(value))
			}
		}
		this.#url.search = params.toString()

		this.#options = options

		if(options.body) {
			const stringify = Array.isArray(options.body) || typeof options.body === 'object'
			this.#body = stringify ? JSON.stringify(options.body) : options.body as BodyInit
		}

		this.#options.headers ??= {}
		this.#options.headers['content-type'] = 'application/json'

		if ('fetch' in this.#options) {
			this.response = this.#fetch()
		} else {
			this.response = this.#xmlhttprequest()
		}
	}

	#fetch() {
		this.#abortcontroller = new AbortController()
		const init = {
			method: this.#options.method,
			headers: this.#options.headers,
			signal: this.#abortcontroller.signal
		} as FetchOptions

		if (this.#body) {
			init.body = this.#body
		}

		return this.#fetchopts.fetch(this.#url, init)
	}

	#xmlhttprequest() {
		return new Promise<Response>((resolve, reject) => {
			this.#xhr = new XMLHttpRequest()
			this.#xhr.open(this.#xhropts.method, this.#url)
			for (const [key, value] of Object.entries(this.#xhropts.headers || {})) {
				this.#xhr.setRequestHeader(key, value)
			}

			const load = () => {
				const headers = {} as Record<string, string>
				this.#xhr!
					.getAllResponseHeaders()
					.trim()
					.split(/[\r\n]+/)
					.forEach((line) => {
						const parts = line.split(': ')
						const header = parts.shift()
						const value = parts.join(': ')
						if (header) headers[header] = value
					})

				if (!('content-type' in headers)) {
					const type =
						this.#xhr!.responseType === 'document' ? 'text/html'
						: this.#xhr!.responseType === 'json' ? 'application/json'
						: this.#xhr!.responseType === 'text' ? 'text/plain'
						: this.#xhr!.responseType === 'arraybuffer' ? 'application/octet-stream'
						: this.#xhr!.responseType === 'blob' ? 'application/octet-stream'
						: this.#xhr!.responseType === '' ? 'text/plain'
						: 'text/plain'
					headers['content-type'] = type
				}

				const response = new Response(this.#xhr!.responseText, {
					status: this.#xhr!.status,
					statusText: this.#xhr!.statusText,
					headers: new Headers(headers)
				})
				resolve(response)
			}

			const abort = () => {
				reject(new Error('XHR aborted'))
			}

			const error = () => {
				reject(new Error('XHR failed'))
			}

			const timeout = () => {
				reject(new Error('XHR timed out'))
			}
            
			this.#xhr.addEventListener('load', load, { once: true })
			this.#xhr.addEventListener('abort', abort, { once: true })
			this.#xhr.addEventListener('error', error, { once: true })
			this.#xhr.addEventListener('timeout', timeout, { once: true })

			if (this.#xhropts.progress) {
				this.#xhr.addEventListener('progress', (event) => {
					this.#xhropts.progress!(event)
				})
			}
			if (this.#body) {
				this.#xhr.send(this.#body as XMLHttpRequestBodyInit)
			} else {
				this.#xhr.send()
			}
		})
	}
}