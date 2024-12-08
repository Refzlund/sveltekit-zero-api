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
import { insertSorted } from '../../utils/sort-merge'
import { KitRequestProxy, KitRequestProxyXHR } from '../../endpoint-proxy.type'

type API<T> = {
	GET?: Endpoint<
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

type Grouping<T, Sortable extends boolean = true> = {
	filter(...args: Parameters<T[]['filter']>): Grouping<T>
} & (Sortable extends true ? { sort(...args: Parameters<T[]['sort']>): Grouping<T, false> } : {})

interface RunesDataInstance<T> {
	api: API<T>
	discriminator: (body: T) => string | false
	/**
	 * If `fetch` is `true` the list will get fetched when referenced the first time.
	 * 
	 * If it's a `number` (milliseconds), it will wait until that amount of time has passed, until it fetches again.
	 * 
	 * This is true for both when retrieving values like iteration; `{#each data.users as user}` and single items; `data.users[id]`
	*/
	fetch?: boolean | number
	live?: (body: T | T[]) => void
	paginator?:
		| {
				limit: string
				skip: string
				count: number
				api: (query: Record<string, string>) => 
					| Promise<T[]> 
					| KitRequestProxy<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
					| KitRequestProxyXHR<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
				total?: () => Promise<number>
		  }
		| {
				api: (page: number) => 
					| Promise<T[]> 
					| KitRequestProxy<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
					| KitRequestProxyXHR<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
				total?: () => Promise<number>
		  }
	/** The groups filtering/sorting first happens when accessed */
	groups?: Record<string, (list: Grouping<T>) => Grouping<T, boolean>>
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
					if(!set) continue
					for (const data of body[key]) {
						set(data)
					}
				}
			})

			meta.lastGetRequestAt = Date.now()
		}
	}

	for (const key in instances) {
		const instance = instances[key]!

		const instanceMap = new SvelteMap<PropertyKey, any>()
		const item = $state({})
		
		const discriminator = instance.discriminator

		let api: API<unknown> = getAPI ? instance.api ?? getAPI[key] as API<unknown> : instance.api

		const listeners = {
			set: [] as Function[],
			remove: [] as Function[]
		}
		function on(
			event: 'set' | 'remove',
			cb: (key: string, values: unknown) => void
		) {
			listeners[event].push(cb)
		}

		function remove(key: PropertyKey) {
			const item = instanceMap.get(key)
			instanceMap.delete(key)
			delete item[key]
			listeners.remove.forEach((cb) => cb(key, item))
		}
		function set(value: unknown | unknown[]) {
			if(Array.isArray(value)) {
				value.forEach(set)
				return
			}

			const key = discriminator(value)
			if(key === undefined || key === false || key === null) {
				return
			}

			if(value === undefined || value === null) {
				return remove(key)
			}

			instanceMap.set(key, value)
			item[key] = value
			listeners.set.forEach((cb) => cb(key, value))
		}
		setters[key] = set

		// CRUD
		function GET(key?: PropertyKey) {
			if(typeof key !== 'undefined') {
				const endpoint = api.id$!(key).GET as Endpoint
				return endpoint.xhr().success(({ body }) => set(body))
			}
			return api.GET?.xhr().success(({ body }) => set(body))
		}
		function POST(data: unknown) {
			const endpoint = api.POST as Endpoint
			endpoint.xhr(data).success(({ body }) => set(body))
		}
		function PUT(key: PropertyKey, data: unknown) {
			const endpoint = api.id$!(key).PUT as Endpoint
			endpoint.xhr(data).success(({ body }) => set(body))
		}
		function PATCH(key: PropertyKey, data: unknown) {
			const endpoint = api.id$!(key).PATCH as Endpoint
			endpoint.xhr(data).success(({ body }) => set(body))
		}
		function DELETE(key: PropertyKey) {
			const endpoint = api.id$!(key).DELETE as Endpoint
			endpoint.xhr().success(() => remove(key))
		}

		let groups: Record<string, any>
		if('groups' in instance) {
			const group: Record<string, unknown[]> = {}
			groups = new Proxy(instance.groups!, {
				get(target, property) {
					if (typeof property === 'string' && property in instance.groups!) {
						const g = group[property]
						if (g) {
							return g
						}

						// * Initiate the group maintainence logic

						const groupArray = $state([]) as unknown[]
						group[property] = groupArray

						let filters = [] as Parameters<Grouping<unknown>['filter']>[0][]
						let sort: Parameters<Grouping<unknown>['sort']>[0] | undefined

						const proxy = {
							filter: (fn) => {
								filters.push(fn)
								return proxy
							},
							sort: (fn) => {
								sort = fn
								return proxy
							}
						} as Grouping<unknown>
						target[property](proxy)

						Array.from(instanceMap.values()).forEach((value, index) => {
							if (filters.every((fn) => fn(value, index, groupArray))) {
								groupArray.push(value)
							}
						})
						if(sort) groupArray.sort(sort)

						on('set', (_, value) => {
							if (filters.every((fn) => fn(value, groupArray.length, groupArray))) {
								if(sort) {
									insertSorted(groupArray, value, sort)
								} else {
									groupArray.push(value)
								}
							}
						})
						on('remove', (key) => {
							const index = groupArray.findIndex(v => discriminator(v) === key)
							if (index !== -1) {
								groupArray.splice(index, 1)
							}
						})

						return groupArray
					}

				}
			})
		}
		
		const cooldown = typeof instance.fetch === 'number' ? instance.fetch : 0
		
		// getAPI will get all items
		let updatedAt = 0
		let itemUpdatedAt: Record<PropertyKey, number> = {}

		proxies[key] = new Proxy(item, {
			getPrototypeOf() {
				return _RuneAPI.prototype
			},
			get(_, property) {
				const update = (
					(instance.fetch === true && updatedAt === 0)
					|| (typeof instance.fetch === 'number' && Date.now() > updatedAt + cooldown)
				)
					&& (
						property === Symbol.iterator
						|| property === 'entries'
						|| property === 'keys'
						|| property === 'length'
						|| property === 'has'
						|| property === 'groups'
					)

				if(update) {
					updatedAt = Date.now()
					GET()
				}

				switch(property) {
					case Symbol.iterator: return () => instanceMap.values()
					case 'entries': return () => instanceMap.entries()
					case 'keys': return () => instanceMap.keys()
					case 'length': return instanceMap.size
					case 'has': return (key: PropertyKey) => instanceMap.has(key)

					// CRUD
					case 'get': return GET
					case 'post': return POST
					case 'put': return PUT
					case 'patch': return PATCH
					case 'delete': return DELETE

					// Proxied objects
					case 'modify': return
					case 'create': return

					// Data
					case 'groups': return groups
					case 'Paginator': return Paginator

					// Validation
					case 'validate': return

					case 'toJSON': return () => Array.from(instanceMap.values())
					case 'toString': return () => JSON.stringify(Array.from(instanceMap.values()))
					
					// Return list-item based on discriminator
					default:
						if (typeof property === 'symbol')
							return instanceMap[property]

						const shouldUpdate = 
							instance.fetch === true && !instanceMap.has(property)
							|| (cooldown > 0 && Date.now() > Math.max(itemUpdatedAt[property] || 0, updatedAt) + cooldown)

						if (shouldUpdate) {
							itemUpdatedAt[property] = updatedAt
							GET(property)
						}

						return instanceMap.get(property)
				}
			}
		})
	}

	refresh()

	return proxies
}
