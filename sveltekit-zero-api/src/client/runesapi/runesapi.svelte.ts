import { Readable } from 'svelte/store'
import { KitRequestXHR } from '../../endpoint-proxy'
import type { EndpointFunction } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'
import { KitValidationError } from '../errors'
import { Promisify } from '../../utils/types'

type API<T> = {
	GET: EndpointFunction<
		any,
		| KitResponse<any, any, T | T[], true>
		| KitResponse<any, any, any, false>
	>
}

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

class Paginator<T> {
	list: T[] = []
	current: number = 0
	total: number = 0
	async next() {}
	async prev() {}
	constructor(count?: number) {}
}

type RuneAPI<T, G, A> = {
	/** Calls GET */
	get(): Promise<T[]>
	/** Calls id$(...).GET */
	get(id: string): Promise<T>

	list: T[]
	Paginator: new (count?: number) => Paginator<T>

	// These, use T from body, and only include if they are in the API (A)
	post(data: T): { errors: KitValidationError[] } | KitRequestXHR // | error KitResponse
	put(id: string, data: T): { errors: KitValidationError[] } | KitRequestXHR // | error KitResponse
	patch(id: string, data: Partial<T>): { errors: KitValidationError[] } | KitRequestXHR // | error KitResponse

	// Only include if A.id$.put or A.id$.patch
	modify(id: string): T & {
		$: {
			validate(
				path?: (string | number) | (string | number)[]
			): KitValidationError[]
			put(): void
			patch(): void
			isModified: boolean
			errors(
				path?: (string | number) | (string | number)[]
			): KitValidationError[]
		}
	}
	// Only include if A.post
	create(): T & {
		$: {
			validate(): KitValidationError[]
			post(): void
			isModified: boolean
			errors(path: string): Partial<KitValidationError>
		}
	}
} & (G extends Record<string, any> ? { groups: Record<keyof G, T[]> } : {}) & {
		[key: string]: T
	}

type KeyOf<T, Key> = Key extends keyof T ? T[Key] : never

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