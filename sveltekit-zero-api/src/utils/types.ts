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

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
type IsAny<T> = IfAny<T, true, never>

export type IsUnknown<T> = IsAny<T> extends never ? (unknown extends T ? true : never) : never