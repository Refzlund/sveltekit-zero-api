const lastBracketRegEx = /(.+)?\[([^[\]]+)\]$/
const isNumber = /^[0-9]+$/

/** Parse `ab[123].cd["efg"].0` -> ['ab', 123, 'cd', 'efg', 0] */
export function parseKeys(key: string) {
	return key
		.split('.')
		.map((v) => (isNumber.test(v) ? +v : v))
		.map(parseSegment)
		.flat()
}

/** `a: { b: { c: true } }` -> [['a.b.c', true]] */
export function parseObjectToKeys(obj: Record<string, any> | Array<any>, parent = '') {
	const result: [string, any][] = []
	
	for (const [key, value] of Array.isArray(obj) ? obj.entries() : Object.entries(obj)) {
		if(!(key in obj)) continue // skip holes in sparse arrays
		const path = (parent !== '' ? `${parent}.` : '') + key
		if (String(value).endsWith('Object]')) {
			result.push(...parseObjectToKeys(value, path))
			continue
		}
		result.push([String(path), value])
	}
	return result
}

function parseSegment(key: string | number) {
	if (typeof key === 'number') return [key]

	let match: RegExpMatchArray | null
	let matches: (string | number)[] | undefined
	while ((match = (<string>key)?.match(lastBracketRegEx))) {
		/** in `crawler['key["array"][0]']` this becomes `key["array"]`, then `key` */
		const property = match[1]
		/** in `crawler['key["array"][0]']` this becomes `0` then `"array"` */
		let bracketed = match[2] as string

		if (bracketed.startsWith('\'') || bracketed.startsWith('"') || bracketed.startsWith('`')) {
			bracketed = bracketed.slice(1, -1)
		} else {
			bracketed = (isNumber.test(bracketed) ? +bracketed : bracketed) as string
		}

		matches ??= []
		matches.unshift(bracketed)

		key = property
	}
	if (key) matches?.unshift(key)
	return matches ?? [key]
}

/** Parse `[['ab.cd.0', 123], ...]` -> `{ 'ab': { cd: [0] } }` */
export function parseItems(items: Iterable<[string, any]>, arrayDuplicates = true) {
	const result = {} as Record<string, any>
	for (const [key, value] of items) {
		const path = parseKeys(key) // ab[1]['123'].abc => ['ab', 1, '123', 'abc']
		if (path.length == 1) {
			if (result[path[0]] !== undefined && arrayDuplicates) {
				const item = result[path[0]]
				if (Array.isArray(item)) {
					item.push(value)
				} else {
					result[path[0]] = [item, value]
				}
				continue
			}
		}

		let parent = result
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i]
			if (!parent[key]) {
				parent[key] = typeof path[i + 1] === 'number' ? [] : {}
			}
			parent = parent[key]
		}

		const lastKey = path[path.length - 1]
		if (parent[lastKey] !== undefined && arrayDuplicates) {
			const item = parent[lastKey]
			if (Array.isArray(item)) {
				item.push(value)
			} else {
				parent[lastKey] = [item, value]
			}
		} else {
			parent[lastKey] = value
		}
	}

	return result
}