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
	#instance: RuneAPIInstance<T>
	#options? = {} as PaginatorOptions<T>
	#constructorOpts: PaginatorConstructorOptions

	#paged = $derived(
		this.#options && 'page' in this.#options
	)

	count = $derived(
		this.#options && 'count' in this.#options && this.#options.count
	)

	/** Shared pagination content between Paginators for the same RuneAPI */
	static #shared = new WeakMap<RuneAPIInstance<any>, Array<unknown[]> | unknown[]>()

	/**
	 * a sparse (holey) array of already populated ranges.
	 * 
	 * If pagaintor is paged, index of this array is `T[]`.  
	 * If paginator is ranged, index of this array is `T`.
	*/
	#ranges: Array<unknown[]> | unknown[]

	#list: T[] = $state([])
	/** The current viewing range of the paginator. */
	get list() {
		return this.#list
	}

	/**
	 * All items that has been viewed via this `Paginator`.
	 * 
	 * If you start (current) on ex. `4`, any `prev` will be preprended, 
	 * while any `next` will be appended to the listed array.
	*/
	readonly listed: T[] = $state([])
	/**
	 * Current paginated "position".
	 * 
	 * If using `range` in the configuration, it will be position relative to `count` (unless specified otherwise).
	 * If count is `10`, `next` will change `current` from ex. `0` to `10`.
	 * 
	 * If using `page` in the configuration, it will indicate the paged index.
	 */
	readonly position: number = $state(0)
	/** 
	 * The total amount of items. 
	 * For `range` it may represent an amount of items, while `page` might represent amount of pages. 
	 * 
	 * However, `total` is provided by the endpoint you provide in the configuration.
	 */
	readonly total: number = $state(0)

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

		this.setPosition(this.#constructorOpts.startPosition ?? 0)
		this.updateTotal()
	}

	/** Paginate to the right */
	async next() {
		if(this.count && !this.#paged) {
			return this.setPosition(this.position + this.count)
		}
		return this.setPosition(this.position + 1)
	}

	/** Paginate to the left */
	async prev() {
		if (this.count && !this.#paged) {
			return this.setPosition(this.position - this.count)
		}
		return this.setPosition(this.position - 1)
	}

	async #virtual(position: number) {
		return this.#instance.list.slice(position, position + 10) as T[]
	}

	async updateTotal() {
		if(this.#options && 'total' in this.#options) {
			// @ts-expect-error
			this.total = await this.#options.total?.()
		}
	}

	/** Paginate to a specific position */
	async setPosition(position: number) {
		let _position = this.position
		let _list = this.#list
		
		// @ts-expect-error
		this.position = position

		if(this.#paged) {
			this.#list = (this.#ranges[position] ?? []) as T[]
		} else {
			this.#list = this.#ranges.slice(position, position + 10) as T[]
		}

		const promise = 
			  !this.#options
			? this.#virtual(position)
			: 'page' in this.#options
			? success(this.#options.page(position))
			: success(this.#options.range({ 
				[this.#options.skip ?? 'skip']: position.toString(),
				[this.#options.limit ?? 'limit']: this.#constructorOpts.count?.toString() ?? this.#options.count?.toString()
			}))

		await new Promise(resolve => setTimeout(resolve, 1000))
		let result = $state(await promise)

		if(!result) {
			if (this.position !== position) return

			// @ts-expect-error
			this.position = _position
			this.#list = _list
			return
		}

		if (this.position === position) {
			this.#list = result
			this.#instance.set(result)
		}

		if(this.#paged) {
			this.#ranges[position] = result
		} else {
			for(let i = position; i < result.length + position; i++) {
				this.#ranges[i] = result[i - position]
			}
		}
	}
}

function success<T>(item: PaginationPromise<T>) {
	if(item instanceof KitRequest) {
		return item.$.success(({body}) => body as T[])[0]
	}
	return item as Promise<T[]>
}

export function paginatorProxy<T>(instance: RuneAPIInstance<any>) {
	return new Proxy(Paginator, {
		construct(target, argArray) {
			return new target(...[instance, ...argArray] as [any])
		},
	})
}