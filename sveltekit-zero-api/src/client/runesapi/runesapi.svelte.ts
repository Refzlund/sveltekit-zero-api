import { KitRequestXHR } from '../../endpoint-proxy'
import type { EndpointFunction } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'

type API<T> = {
	GET: EndpointFunction<
		any,
		| KitResponse<any, any, T | T[], true>
		| KitResponse<any, any, any, false>
	>
}

interface RunesDataInstance<T> {
	api: API<T>
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
	group?: {

	}
}

type InstanceType<R extends RunesDataInstance<any>> = R extends RunesDataInstance<infer T> ? T : never

class Paginator<R extends RunesDataInstance<any>> {
	list: InstanceType<R>[] = []
	current: number = 0
	total: number = 0
	async next() {}
	async prev() {}
	constructor(count?: number) {}
}

type RuneAPI<R extends RunesDataInstance<any>> = {
	get(): R['api']['GET']
	list: InstanceType<R>[]
	Paginator: new (count?: number) => Paginator<R>
} & {
	[key: string]: InstanceType<R>
}

export function runesAPI<T>(
	instances: { [K in keyof T]: RunesDataInstance<T[K]> }
) {
	const map = {} as {
		[K in keyof T]: RuneAPI<RunesDataInstance<T[K]>>
	}

	for (const key in instances) {

		map[key] = new Proxy({}, {

		}) as any
	}

	return map
}