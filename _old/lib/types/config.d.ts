import type { FetchAPICallback } from '../types'

/** @internal */
export interface ZeroAPIConfig {
	/** Prepended on every request. Contains anything you'd put in `RequestInit` @ `fetch(url, RequestInit)` */
	baseData?: Parameters<typeof fetch>[1]

	/** Default format deocoding from responses. .json() ex. */
	format?: "text" | "json"

	/** 
	 * (Def. true): Will stringify any objects passed as query parameters.
	 * 
	 * ```ts
	 * post({ query: { 
	 *    num: 123, 
	 *    obj: { message: 'Hi' }, 
	 *    arr: ['there']
	 * }})
	 * ```
	 * will be sent as
	 * ```ts
	 * post({ query: { 
	 *    num: 123, 
	 *    obj: JSON.stringify({ message: 'Hi' }), 
	 *    arr: JSON.stringify(['there'])
	 * }})
	 * ```
	*/
	stringifyQueryObjects?: boolean

	/** This will be prepended on the URL. 
	 * 
	 * Default value is `''` - meaning api.products.get results in '/api/products'
	 * 
	 * `'https://anotherdomain.com'` would result in `https://anotherdomain.com/api/products`
	*/
	baseUrl?: string

	// A callback function that will be called on successful requests
	onSuccess?: (res: any) => Promise<any>

	/** A callback function that will be called if the API somehow throws an error */
	onError?: (res: any) => Promise<any>

	/** Prepended callbacks will be added to every request */
	prependCallbacks?: (method: Omit<ReturnType<FetchAPICallback<any>>['_'], '$'>) => void 
}