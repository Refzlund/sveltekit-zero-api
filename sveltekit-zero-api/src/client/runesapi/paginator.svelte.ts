import { KitRequestProxy, KitRequestProxyXHR } from '../../endpoint-proxy.type'
import { KitResponse } from '../../server/http'

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
	range: (query: Record<string, string>) =>
		| Promise<T | T[]>
		| KitRequestProxy<KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>>
		| KitRequestProxyXHR<KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `range` paginator, it makes sense for the total to be the total amount of items.
	*/
	total?: () => Promise<number>
}
| {
	page: (index: number) =>
		| Promise<T | T[]>
		| KitRequestProxy<KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>>
		| KitRequestProxyXHR<KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `pagae` paginator, it makes sense for the total to be the total paginations available.
	*/
	total?: () => Promise<number>
}

export class Paginator<T> {
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

	constructor(count?: number) { }

	/** Paginate to the right */
	async next() {}
	/** Paginate to the left */
	async prev() {}
	/** Paginate to a specific position */
	async setPosition(position: number) {
		this.position = position
	}
}