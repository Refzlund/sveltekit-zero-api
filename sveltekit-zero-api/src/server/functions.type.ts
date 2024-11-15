import type { Promisify } from '../utils/types.ts'
import type { Generic } from './generic.ts'
import type { InternalServerError, KitResponse, StatusCode } from './http.ts'
import type { KitEvent } from './kitevent.ts'

export type Fn = (event: KitEvent, ...args: any[]) => KitResponse | Promise<KitResponse>

export type FnsRecord = Record<string, Fn | ((event: KitEvent) => Generic<(...args: any[]) => Promisify<any>>)>

export type FnArgs<T extends FnsRecord[string]> = T extends (
	...args: [infer TKitEvent, ...infer Args]
) => infer Result
	? Args
	: never

export type FnResult<T extends FnsRecord[string]> = T extends (
	...args: [infer TKitEvent, ...infer Args]
) => infer Result
	? Result
	: never

export type Functions<T extends FnsRecord, Results extends KitResponse = never> = {
	[K in keyof T]: ReturnType<T[K]> extends Generic<infer Fn>
		? Fn
		: (...args: FnArgs<T[K]>) => Promisify<
			Extract<FnResult<T[K]> | Results, KitResponse<StatusCode['Success']>>['body'],
			| Exclude<Extract<FnResult<T[K]>, KitResponse> | Results, KitResponse<StatusCode['Success']>>
			| InternalServerError<{
					code: 'function_failed'
					error: 'An unexpected error occurred when running the function.'
				}>
		>
}
