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

export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
export type IsAny<T> = IfAny<T, true, never>

export type IsUnknown<T> = IsAny<T> extends never ? (unknown extends T ? true : never) : never

/** Turn any type into a promise, if not already */
export type Promisify<T, Catch = never> = Omit<T extends Promise<infer U> ? T : Promise<T>, 'then' | 'catch'> & {
	// @ts-expect-error `R = R | R2` to satisfy Promise
	then: <R = R | R2, R2 = never>(
		onfulfilled?: null | ((value: T) => R | PromiseLike<R>),
		onrejected?: (reason: [Catch] extends [never] ? unknown : Catch) => R2
	) => Promisify<R, Catch>
	catch: <R>(reason: (error: [Catch] extends [never] ? unknown : Catch) => R) => Promisify<Awaited<T> | R>
	finally: () => Promise<any>
	readonly [Symbol.toStringTag]: string
}

export type AwaitAll<T extends 
	| (Promise<unknown> | unknown)[]
	| readonly (Promise<unknown> | unknown)[]
> = T extends [infer U, ...infer V] ? [Awaited<U>, ...AwaitAll<V>] : T

/** Takes all properties of T, and deeply ensure they become U */
export type MapDeepTo<T, U> = {
	[K in keyof T]?: NonNullable<T[K]> extends Record<PropertyKey, any>
		? MapDeepTo<T[K], U>
		: T[K] extends any[]
		? Array<MapDeepTo<T[K][number], U>>
		: NonNullable<U>
} 

export type MaybePromise<T> = T | Promise<T>
