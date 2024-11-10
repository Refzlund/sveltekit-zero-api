
interface CrawlHandler<NoKeys extends boolean = false> {
	/**
	 * Match keys in brackets inside key-strings?
	 *
	 * Ex. `some.nested['key[0]["name"]']` is the same as `some.nested.key[0].name`
	 * @default false
	*/
	matchStringedKeys?: boolean

	/**
	 * Convert keys to numbers. Doing `new Proxy()[4]` the key `4` will be interpreted as a string; `"4"`.
	 *
	 * This option converts anything that tests as ONLY a number `/^[0-9]+$/`, to a number.
	 *
	 * 	@default false
	*/
	numberedKeys?: boolean

	/** Allow `return state.crawl([])` resulting in no keys */
	allowNoKeys?: NoKeys
	/** Do `return crawl(key)` to resume normal behaviour */
	get?(state: {
		/** All keys crawled */
		keys: PropertyKey[]
		/** Current key */
		key: NoKeys extends true ? PropertyKey | undefined : PropertyKey
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
		/** Current key */
		key: NoKeys extends true ? PropertyKey | undefined : PropertyKey
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

const lastBracketRegEx = /(.+)\[([^[\]]+)\]$/
const isNumber = /^[0-9]+$/

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
export function proxyCrawl<NoKeys extends boolean = false>(handler: CrawlHandler<NoKeys>) {
	
	const createCrawler = (keys: PropertyKey[], nested: string[] = []) => {
		let proxy = {} as Record<PropertyKey, ReturnType<typeof createCrawler>>
		return new Proxy(function () {}, {
			get(_, key: PropertyKey) {
				key = handler.numberedKeys === true && isNumber.test(key as string) ? +(key as string) : key as string

				if(handler.matchStringedKeys === true) {
					let match: RegExpMatchArray | null
					let matches: string[] | undefined
					while ((match = String(key).match(lastBracketRegEx))) {
						/** in `crawler['key["array"][0]']` this becomes `key["array"]`, then `key` */
						let property = match[1]
						/** in `crawler['key["array"][0]']` this becomes `0` then `"array"` */
						let bracketed = match[2]

						if (bracketed.startsWith("'") || bracketed.startsWith('"') || bracketed.startsWith("`")) {
							bracketed = bracketed.slice(1, -1)
						}

						matches ??= []
						matches.push(bracketed)

						key = property
					}
					if (matches) {
						nested.push(...matches)
					}
				}

				if (handler.get) {
					let next = nested.pop()
					return handler.get({ 
						keys, 
						key: key,
						crawl: (key) => {
							if(next !== undefined) {
								return createCrawler([...keys, ...(Array.isArray(key) ? key : [key])], [...nested])[next]
							} else {
								return createCrawler([...keys, ...(Array.isArray(key) ? key : [key])], [...nested])
							}
						}
					})
				}

				let next = nested.pop()
				proxy[key] ??= createCrawler([...keys, key], [...nested])

				if(next) {
					return proxy[key][next]
				}

				return proxy[key]
			},
			apply(_, thisArg, args) {
				let keysCopy = [...keys]
				let key = keysCopy.pop()!
				key = handler.numberedKeys && isNumber.test(key as string) ? +(key as string) : (key as string)

				if(!handler.allowNoKeys && key === undefined) {
					throw new Error(
						'If you see this, you might have done `return state.crawl([])` in `get`, causing the `state.key` in `apply` to be undefined. To allow this behaviour, please provide `allowNoKeys: true` in the handler proxyCrawl handler.', {
							cause: { keys, key: key, args }
						}
					)
				}

				if (handler.apply) {
					let next = nested.pop()
					return handler.apply({
						keys: keysCopy,
						key,
						args,
						crawl: (key) => {
							if (next !== undefined) {
								return createCrawler([...keysCopy, ...(Array.isArray(key) ? key : [key])], [...nested])[next]
							} else {
								return createCrawler([...keysCopy, ...(Array.isArray(key) ? key : [key])], [...nested])
							}
						}
					})
				}
			}
		}) as Record<PropertyKey, any> & ((...args: any[]) => any)
	}
		
	return createCrawler([])
}