import { KitRequest } from '../../endpoint-proxy'
import { KitRequestProxy, KitRequestProxyXHR } from '../../endpoint-proxy.type'
import { KitResponse } from '../../server/http'
import { RuneAPIInstance } from './instance.svelte'

type PaginationPromise<T> = 
	| Promise<T[]>
	| KitRequestProxy<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
	| KitRequestProxyXHR<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>

export type PaginatorOptions<T> = {
	/** 
	 * Query parameter for the limit.  
	 * Ex. resulting in `?limit=10` where `10` is the count.
	 * 
	 * @default 'limit'
	*/
	limit?: string
	/**
	 * Query parameter for the beginning of the list.  
	 * Ex. resulting in `?skip=50` where `50` is the current `position` + `count`.
	 * 
	 * @default 'skip'
	*/
	skip?: string
	/**
	 * The amount to increment each step of `paginator.next()` and `paginator.prev()`.  
	 * This therefore, also represents the number in the `limit` query.
	*/
	count: number
	/** Start at `skip`, then `limit` that to `count`  */
	range: (query: Record<string, string>) => PaginationPromise<T>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `range` paginator, it makes sense for the total to be the total amount of items.
	*/
	total?: () => Promise<number>
}
| {
	page: (index: number) => PaginationPromise<T>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `pagae` paginator, it makes sense for the total to be the total paginations available.
	*/
	total?: () => Promise<number>
}

export interface PaginatorConstructorOptions {
	/**
	 * Start position of the paginator.
	*/
	startPosition?: number
	/** 
	 * Override `range` count OR virtual pagination 
	 * where pagination options aren't specified.
	*/
	count?: number
}

export class Paginator<T> {
	#instance: RuneAPIInstance
	#options?: PaginatorOptions<T>
	#constructorOpts: PaginatorConstructorOptions

	/** Shared pagination content between Paginators for the same RuneAPI */
	static #shared = new WeakMap<RuneAPIInstance, Array<unknown[]> | unknown[]>()

	/**
	 * a sparse (holey) array of already populated ranges.
	 * 
	 * If pagaintor is paged, index of this array is `T[]`.  
	 * If paginator is ranged, index of this array is `T`.
	*/
	#ranges: Array<unknown[]> | unknown[]

	/** The current viewing range of the paginator. */
	list: T[] = $state([])
	/**
	 * All items that has been viewed via this `Paginator`.
	 * 
	 * If you start (current) on ex. `4`, any `prev` will be preprended, 
	 * while any `next` will be appended to the listed array.
	*/
	listed: T[] = $state([])
	/**
	 * Current paginated "position".
	 * 
	 * If using `range` in the configuration, it will be position relative to `count` (unless specified otherwise).
	 * If count is `10`, `next` will change `current` from ex. `0` to `10`.
	 * 
	 * If using `page` in the configuration, it will indicate the paged index.
	 */
	position: number = $state(0)
	/** 
	 * The total amount of items. 
	 * For `range` it may represent an amount of items, while `page` might represent amount of pages. 
	 * 
	 * However, `total` is provided by the endpoint you provide in the configuration.
	 */
	total?: number = $state(0)

	get isLoading() {
		return true
	}

	constructor(...args: [opts: PaginatorConstructorOptions]) {
		this.#instance = args.shift()! as any
		this.#options = this.#instance.options.paginator as PaginatorOptions<T>
		this.#constructorOpts = args[0] ?? {}

		this.#ranges = Paginator.#shared.get(this.#instance)!
		if(!this.#ranges) {
			Paginator.#shared.set(this.#instance, this.#ranges = [])
		}
	}

	/** Paginate to the right */
	async next() {
		
	}

	/** Paginate to the left */
	async prev() {
		
	}

	async #virtual(position: number) {
		return this.#instance.list.slice(position, position + 10) as T[]
	}

	/** Paginate to a specific position */
	async setPosition(position: number) {
		this.position = position

		const promise = 
			  !this.#options 
			? this.#virtual(position)
			: 'page' in this.#options 
			? success(this.#options.page(position))
			: success(this.#options.range({ 
				[this.#options.skip ?? 'skip']: position.toString(),
				[this.#options.limit ?? 'limit']: this.#constructorOpts.count?.toString() ?? this.#options.count?.toString()
			}))
	}
}

function success<T>(item: PaginationPromise<T>) {
	if(item instanceof KitRequest) {
		return item.$.success(({body}) => body as T[])[0]
	}
	return item as Promise<T[]>
}

export function paginatorProxy(instance: RuneAPIInstance) {
	return new Proxy(Paginator, {
		construct(target, argArray) {
			return new target(...[instance, ...argArray] as [any])
		},
	})
}