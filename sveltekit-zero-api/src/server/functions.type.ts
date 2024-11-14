import { Promisify } from '../utils/types.ts'
import { Generic } from './functions.ts'
import { InternalServerError, KitResponse, StatusCode } from './http.ts'
import { KitEvent } from './kitevent.ts'

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

export type Functions<T extends FnsRecord> = {
	[K in keyof T]: ReturnType<T[K]> extends Generic<infer Fn>
		? Fn
		: (...args: FnArgs<T[K]>) => Promisify<
				Extract<FnResult<T[K]>, KitResponse<StatusCode['Success']>>['body'],
				| Exclude<Extract<FnResult<T[K]>, KitResponse>, KitResponse<StatusCode['Success']>>
				| InternalServerError<{
						code: 'function_failed'
						error: 'An unexpected error occurred when running the function.'
				  }>
		  >
}
