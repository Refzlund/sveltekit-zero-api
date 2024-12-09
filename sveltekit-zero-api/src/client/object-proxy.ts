
/**
 * Returns unmodified value of `ref`, 
 * but once modified, returns modified value,
 * and keeps the ref value
*/
export function objectProxy<T extends Record<PropertyKey, unknown>>(ref: T) {
	const combined = structuredClone(ref) as T
	const modified = {} as T
	
	return new Proxy(combined, {
		get(target, p, receiver) {
			return Reflect.get(target, p, receiver)
		},
		set(target, p: keyof T, value) {
			modified[p] = value
			combined[p] = value
			return true
		},
	})
}

