export type MaybePromise<T> = T | Promise<T>
export type MaybeArray<T> = T | Array<T>
export type NonReadonly<T> = {
	-readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U[] : T[K] extends Record<PropertyKey, unknown> ? NonReadonly<T[K]> : T[K]
} extends infer T ? T : never