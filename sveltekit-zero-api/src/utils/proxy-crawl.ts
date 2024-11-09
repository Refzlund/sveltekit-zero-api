
interface CrawlHandler {
	/** Do `return crawl(key)` to resume normal behaviour */
	get?(state: {
		/** All keys crawled */
		keys: PropertyKey[]
		/** Current key */
		key: PropertyKey
		/**
		 * Returns the proxy crawler, with or without the new provided key
		 *
		 * @example // return a function to be called that replaces current key, with other key
		 * return function fn(str: string) { return crawl(str) }
		 */
		crawl: (key: PropertyKey | PropertyKey[]) => ReturnType<typeof proxyCrawl>
	}): any
	apply?(state: {
		/** All keys crawled, including the key being called upon */
		keys: PropertyKey[]
		/** Arguments provided to the function */
		args: any[]
		/**
		 * Returns the proxy crawler, with or without the new provided key
		 *
		 * @example // return a function to be called that replaces current key, with other key
		 * return function fn(str: string) { return crawl(str) }
		*/
		crawl: (key: PropertyKey | PropertyKey[]) => ReturnType<typeof proxyCrawl>
	}): any
}

/**
 * Allows you to get positional arguments
 * 
 * @example
 * 
 * const crawl = proxyCrawl({ 
 *     apply: (state) => [...state.keys, ...args] 
 * })
 * 
 * const result = crawl.here.we.go(123)
 * console.log(result) // ['here', 'we', 'go', 123]
*/
export function proxyCrawl(handler: CrawlHandler) {
	const createCrawler = (keys: PropertyKey[]) => {
		let proxy = {} as Record<PropertyKey, any>
		return new Proxy(function () {}, {
			get(_, p) {
				const match = String(p).match(/(.+)\[([0-9]+)\]$/)
				if (match)
					proxy[p] ??= createCrawler([...keys, match[1], +match[2]])
				else
					proxy[p] ??= createCrawler([...keys, p])

				if (handler.get) {
					return handler.get({ 
						keys, 
						key: p, 
						crawl: (key) => createCrawler([
							...keys,
							...(Array.isArray(key) ? key : [key])
						]) 
					})
				}

				return proxy[p]
			},
			apply(_, thisArg, args) {
				return handler.apply?.({ 
					keys, 
					args, 
					crawl: (key) => createCrawler([
						...keys, 
						...(Array.isArray(key) ? key : [key])
					])
				}) ?? thisArg(...args)
			}
		}) as Record<PropertyKey, any> & ((...args: any[]) => any)
	}
		
	return createCrawler([])
}