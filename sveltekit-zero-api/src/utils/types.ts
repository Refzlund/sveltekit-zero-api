export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {}

/**
 * A utiltiy type that removes never keys,
 * and adds ? to optional keys
*/
export type FixKeys<T> = {
	[K in keyof T as [T[K]] extends [never] ? never : undefined extends T[K] ? never : K]: T[K]
} & {
	[K in keyof T as [T[K]] extends [never] ? never : undefined extends T[K] ? K : never]?: T[K]
}
