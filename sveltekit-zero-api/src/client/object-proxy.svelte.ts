
const IS_PROXY = Symbol('sveltekit-zero-api.objectproxy')
const DELETE_KEY = Symbol('sveltekit-zero-api.objectproxy.delete')

const PARENT = Symbol('sveltekit-zero-api.objectproxy.parent')
const KEY = Symbol('sveltekit-zero-api.objectproxy.key')

const GET_MODIFIED = Symbol('sveltekit-zero-api.objectproxy.getmodified')

/** Gets the root */
export function getProxyModified(object: ObjectProxy) {
	return object[GET_MODIFIED]
}

export type ObjectProxy<T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>> = T & {
	[IS_PROXY]: true
}


function proxify(value: unknown) {
	return typeof value === 'object'
		&& value !== null
		&& !value[IS_PROXY]
		&& (Array.isArray(value) || String(value).endsWith('Object]'))
}

/**
 * A proxy that structurally clones a reference, 
 * and tracks modification to that reference.
*/
export function objectProxy<T extends Record<PropertyKey, unknown>>(ref: T): ObjectProxy<T> {
	const combined = $state(structuredClone($state.snapshot(ref))) as T
	const modified = $state({}) as T

	const proxies = new Map<string, Array<unknown> | Record<PropertyKey, unknown>>()

	/** Compares the value, to the ref-value at given path */
	function compare(value: unknown, path: PropertyKey[]) {
		let refValue = ref as any
		for (const p of path) {
			refValue = refValue?.[p]
			if (refValue === undefined)
				break
		}

		if (value instanceof Date && refValue instanceof Date) {
			return value.valueOf() === refValue.valueOf()
		}

		return value === refValue
	}

	/** Sets the value, to the modified object at a given path */
	function modify(value: unknown, path: string[]) {
		const lastKey = path.pop()!

		let parent = modified as any
		for (let i = 0; i < path.length; i++) {
			const p = path[i]

			if(!parent[p]) {
				const key = path[i + 1] ?? lastKey
				const state = $state(Object.assign(/[1-9]+[0-9]*/.test(key) ? [] : {}, { [PARENT]: parent, [KEY]: p }))
				parent[p] = state
			}
			parent = parent[p]
		}

		if (value === DELETE_KEY) {
			delete parent[lastKey]

			let key: PropertyKey
			while (
				(key = parent[KEY])
				&& Object.keys(parent[PARENT]![key]).length === 0
			) {
				parent = parent[PARENT]!
				delete parent[key]
			}
			return
		}

		parent[lastKey] = value
	}

	function makeProxy(obj: Array<unknown> | Record<PropertyKey, unknown>, path: string[]) {
		for(const key in obj) {
			const value = obj[key]

			if (proxify(value)) {
				makeProxy(value as typeof obj, [...path, key])
			} 
			else if (!compare(value, [...path, key])) {
				modify(value, [...path, key])
			}
			obj[key] = value
		}

		const proxy = new Proxy(obj, {
			get(target, p) {
				if (p === IS_PROXY) return true
				if (p === GET_MODIFIED) return modified

				if(typeof p === 'symbol') return target[p]
				
				let value = proxies.get([...path, p].map(String).join('.')) ?? target[p]
				if (proxify(value)) {
					value = makeProxy(value, [...path, p])
				}

				return value
			},
			set(target, p, value) {
				if (typeof p === 'symbol') {
					target[p] = value
					return true
				} 

				if (proxify(value)) {
					modify(DELETE_KEY, [...path, p])

					const v = $state(value)
					target[p] = v 
					value = makeProxy(v, [...path, p])
				}
				else {
					if (compare(value, [...path, p]))
						modify(DELETE_KEY, [...path, p])
					else
						modify(value, [...path, p])
				}
				target[p] = value

				return true
			}
		})
		proxies.set(path.join('.'), proxy)
		return proxy
	}

	return makeProxy(combined, []) as ObjectProxy<T>
}

