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
import { runedObjectStorage, runedSessionObjectStorage, runedStorage } from '../runed-storage.svelte'

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
	/** The ID associated with this runesAPI */
	id: string
	/** Include this query on `api.GET` */
	query?: (state: {
		/** When was the last api.GET request sent? (milliseconds elapsed since midnight, January 1, 1970 — UTC) */
		lastGetRequestAt: number
	}) => Record<string, unknown>
	indexedDB?: {}
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
	let getAPI: APIProxy | undefined
	let instances: Partial<Record<string, RunesDataInstance<unknown>>>
	let options: RunesAPIOptions<unknown> | undefined

	if(args[0] instanceof APIProxy) {
		getAPI = args[0]
		instances = args[1]
		options = args[2]
	}
	else {
		instances = args[0]
	}

	const proxies = {} as Record<string, {}>
	const setters = {} as Record<string, (data: any) => void>

	const id = options?.id ?? Math.random().toString(36).slice(2)

	const defaultMeta = { lastGetRequestAt: 0 }
	const meta = getAPI 
		? options?.id 
			? runedSessionObjectStorage(`runesapi-${id}`, defaultMeta) 
			: runedObjectStorage(`runesapi-${id}`, defaultMeta)
		: defaultMeta

	function refresh() {
		if (getAPI) {
			const GET = getAPI.GET as Endpoint
			const opts = (options || {}) as RunesAPIOptions<unknown>

			GET(null, { query: opts.query?.(meta) }).success(({ body }) => {
				for (const key in body) {
					const set = setters[key]
					for (const data of body[key]) {
						set(data)
					}
				}
			})

			meta.lastGetRequestAt = Date.now()
		}
	}

	for (const key in instances) {
		const map = new SvelteMap<PropertyKey, any>()
		const item = $state({})
		
		const discriminator = instances[key]!.discriminator

		let api: API<unknown> = getAPI ? getAPI[key] as API<unknown> : instances[key]!.api

		function remove(key: PropertyKey) {
			map.delete(key)
			delete item[key]
		}
		function set(value: unknown | unknown[]) {
			if(Array.isArray(value)) {
				return value.forEach(set)
			}

			const key = discriminator(value)
			if(key === undefined || key === false || key === null) {
				return
			}

			if(value === undefined || value === null) {
				return remove(key)
			}

			map.set(key, value)
			item[key] = value
		}
		setters[key] = set

		// CRUD
		function get(key?: PropertyKey) {
			if(typeof key !== 'undefined') {
				const endpoint = api.id$!(key).GET as Endpoint
				return endpoint().success(({ body }) => set(body))
			}
			return api.GET().success(({ body }) => set(body))
		}
		function post(data: unknown) {
			const endpoint = api.POST as Endpoint
			endpoint(data).success(({ body }) => set(body))
		}
		function put(key: PropertyKey, data: unknown) {
			const endpoint = api.id$!(key).PUT as Endpoint
			endpoint(data).success(({ body }) => set(body))
		}
		function patch(key: PropertyKey, data: unknown) {
			const endpoint = api.id$!(key).PATCH as Endpoint
			endpoint(data).success(({ body }) => set(body))
		}
		function delete_(key: PropertyKey) {
			const endpoint = api.id$!(key).DELETE as Endpoint
			endpoint().success(() => remove(key))
		}
		
		let lastUpdate = 0
		proxies[key] = new Proxy(item, {
			getPrototypeOf() {
				return _RuneAPI.prototype
			},
			get(_, property) {
				const update = 
					lastUpdate === 0 
					&& !getAPI 
					&& (
					   property === Symbol.iterator
					|| property === 'entries'
					|| property === 'keys'
					|| property === 'length'
					|| property === 'has'
				)

				if(update) {
					lastUpdate = Date.now()
					get()
				}

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

					case 'toJSON': return () => Array.from(map.values())
					case 'toString': return () => JSON.stringify(Array.from(map.values()))
					
					// Return list-item based on discriminator
					default: 
						get(property)
						return map.get(property)
				}
			}
		})
	}

	refresh()

	return proxies
}
