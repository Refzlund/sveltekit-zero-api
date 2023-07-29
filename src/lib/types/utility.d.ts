type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

interface SimplifyOptions {
	/**
	Do the simplification recursively.
	@default false
	*/
	deep?: boolean
}

// Flatten a type without worrying about the result.
type Flatten<
	AnyType,
	Options extends SimplifyOptions = {},
> = Options['deep'] extends true
	? { [KeyType in keyof AnyType]: Simplify<AnyType[KeyType], Options> }
	: { [KeyType in keyof AnyType]: AnyType[KeyType] }

type Simplify<
	AnyType,
	Options extends SimplifyOptions = {},
> = Flatten<AnyType> extends AnyType
	? Flatten<AnyType, Options>
	: AnyType

type DeepWriteable<T> = Simplify<{ -readonly [P in keyof T]: T[P] extends object ? DeepWriteable<T[P]> : T[P] }>

type Nullable<T> = T | undefined

type Flat<T> = T extends object ? { [K in keyof T]: Flat<T[K]> } : T
