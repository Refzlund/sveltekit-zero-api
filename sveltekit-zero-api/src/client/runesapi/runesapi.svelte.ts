import { KitRequestXHR } from '../../endpoint-proxy'
import type { Endpoint } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'
import { Slugged } from '../../utils/slugs'
import { KeyOf } from '../../utils/types'
import { RuneAPI } from './runeapi.type'

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

export function runesAPI(instances?: any) {
	const map = {} as Record<any, any>

	for (const key in instances) {
		map[key] = new Proxy(function () {}, {
			get() {
				return map[key]
			},
			apply() {
				return map[key]
			},
			construct() {
				return map[key]
			},
		}) as any
	}

	return map
}
