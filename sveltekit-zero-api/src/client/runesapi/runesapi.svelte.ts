import { SvelteMap } from 'svelte/reactivity'
import { KitRequestXHR } from '../../endpoint-proxy'
import type { Endpoint } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'
import { Slugged } from '../../utils/slugs'
import { KeyOf } from '../../utils/types'
import { APIProxy } from '../api-proxy'
import { RuneAPI } from './runeapi.type'
import { RuneAPI as _RuneAPI } from '.'
import { Paginator } from './paginator.svelte'

type API<T> = {
	GET: Endpoint<
		any,
		KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>
	>
	POST?
} & Partial<
	Slugged<{
		GET?
		PUT?
		PATCH?
		DELETE?
	}>
>

type Grouping<T> = {
	sort(...args: Parameters<T[]['sort']>): Grouping<T>
	filter(...args: Parameters<T[]['filter']>): Grouping<T>
}

interface RunesDataInstance<T> {
	api: API<T>
	discriminator: (body: T) => string | false
	live?: (body: T | T[]) => void
	paginator?:
		| {
				limit: string
				skip: string
				count: number
				api: (query: Record<string, string>) => KitRequestXHR
				total?: () => Promise<number>
		  }
		| {
				api: (page: number) => KitRequestXHR
				total?: () => Promise<number>
		  }
	/** The groups filtering/sorting first happens when accessed */
	groups?: Record<string, (list: Grouping<T>) => Grouping<T>>
}

interface RunesAPIOptions<T> {
	/** Include this query on `api.GET` */
	query?: (state: {
		/** When was the last api.GET request sent? (milliseconds elapsed since midnight, January 1, 1970 — UTC) */
		lastGetRequestAt: number
	}) => Record<string, unknown>
	indexedDB?: {
		/** The ID associated with this runesAPI */
		id: string
	}
	live?: (cb: (data: T) => void) => void
}

export function runesAPI<TItems, TType>(
	instances: TItems & {
		[K in keyof TType]: RunesDataInstance<KeyOf<TType, K>>
	}
): {
	[K in keyof TItems]: RuneAPI<
		KeyOf<TType, K>,
		KeyOf<KeyOf<TItems, K>, 'groups'>,
		KeyOf<KeyOf<TItems, K>, 'api'>
	>
}

export function runesAPI<TAPI, TItems, TData extends Record<string, any[]>>(
	api: TAPI & {
		GET: Endpoint<
			any,
			KitResponse<any, any, TData, true> | KitResponse<any, any, any, false>
		>
	},
	items: TItems & {
		[Key in keyof TData]?: Pick<
			RunesDataInstance<KeyOf<TData, Key>[number]>,
			'discriminator' | 'groups'
		>
	},
	options?: RunesAPIOptions<TData>
): {
	[K in keyof TItems]: RuneAPI<
		KeyOf<TData, K>[number],
		KeyOf<KeyOf<TItems, K>, 'groups'>,
		KeyOf<TAPI, K>
	>
}

export function runesAPI(...args: any[]) {
	let instances: Partial<Record<string, RunesDataInstance<unknown>>>
	let getAPI: APIProxy | undefined
	if(args[0] instanceof APIProxy) {
		getAPI = args[0]
		instances = args[1]
	}
	else {
		instances = args[0]
	}

	const proxies = {} as Record<string, {}>
	const setters = {} as Record<string, (key: PropertyKey, data: any) => void>

	for (const key in instances) {
		const map = new SvelteMap<PropertyKey, any>()
		const item = $state(new _RuneAPI())

		let api: API<unknown> = getAPI ? getAPI[key] as API<unknown> : instances[key]!.api

		function remove(key: PropertyKey) {
			map.delete(key)
			delete item[key]
		}
		function set(key: PropertyKey, value: any) {
			if(value === undefined || value === null) {
				return remove(key)
			}

			map.set(key, value)
			item[key] = value
		}
		setters[key] = set

		// CRUD
		function get(key?: PropertyKey) {
			
		}
		function post(data: unknown) {
			
		}
		function put(key: PropertyKey) {
			
		}
		function patch(key: PropertyKey) {
			
		}
		function delete_(key: PropertyKey) {
			
		}

		proxies[key] = new Proxy(item, {
			get(_, property) {
				switch(property) {
					case Symbol.iterator: return () => map.values()
					case 'entries': return () => map.entries()
					case 'keys': return () => map.keys()
					case 'length': return map.size
					case 'has': return (key: PropertyKey) => map.has(key)

					// CRUD
					case 'get': return get
					case 'post': return post
					case 'put': return put
					case 'patch': return patch
					case 'delete': return delete_

					// Proxied objects
					case 'modify': return
					case 'create': return

					// Data
					case 'groups': return
					case 'Paginator': return Paginator

					// Validation
					case 'validate': return
					
					// Return list-item based on discriminator
					default: return map.get(property)
				}
			}
		})
	}

	if (getAPI) {
		getAPI
	}

	return proxies
}
