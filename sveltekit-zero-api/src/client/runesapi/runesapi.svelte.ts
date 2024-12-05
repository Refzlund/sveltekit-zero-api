import { KitRequestXHR } from '../../endpoint-proxy'
import type { EndpointFunction } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'
import { Slugged } from '../../utils/slugs'
import { KeyOf } from '../../utils/types'
import { RuneAPI } from './runeapi.type'

type API<T> = {
	GET: EndpointFunction<
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

interface RunesDataInstance<A, T, G> {
	api: A & API<T>
	discriminator: (body: T) => string | false
	live?: (body: T | T[]) => void
	paginator?: {
		limit: string
		skip: string
		count: number
		api: (query: Record<string, string>) => KitRequestXHR
		total?: () => Promise<number>
	} | {
		api: (page: number) => KitRequestXHR
		total?: () => Promise<number>
	}
	/** The groups filtering/sorting first happens when accessed */
	groups?: G & Record<string, (list: Grouping<T>) => Grouping<T>>
}

export class Paginator<T> {
	list: T[] = []
	current: number = 0
	total: number = 0
	async next() {}
	async prev() {}
	constructor(count?: number) {}
}


export function runesAPI<A, T, G>(
	instances: { [K in keyof T | keyof G | keyof A]: RunesDataInstance<KeyOf<A, K>, KeyOf<T, K>, KeyOf<G, K>> }
) {
	const map = {} as {
		[K in keyof T | keyof G | keyof A]: RuneAPI<KeyOf<T, K>, KeyOf<G, K>, KeyOf<A, K>>
	}

	for (const key in instances) {

		map[key] = new Proxy({}, {

		}) as any
	}

	return map
}