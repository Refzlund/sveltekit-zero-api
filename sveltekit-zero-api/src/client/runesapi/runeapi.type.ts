import { EndpointFunction } from '../../server/endpoint'
import { Slugged } from '../../utils/slugs'
import { KitValidationError, ValidatedKitRequestXHR } from '../errors'
import { Paginator } from './runesapi.svelte'

type Input<P extends EndpointFunction> = P extends EndpointFunction<infer Input> ? Input : never

interface Create<T, P extends EndpointFunction> {
	post(data: Input<P>['body']): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
	create(): T & {
		$: {
			validate(
				path?: (string | number) | (string | number)[]
			): KitValidationError[]
			post(): ValidatedKitRequestXHR
			isModified: boolean
			errors(path: string): KitValidationError[]
		}
	}
}

/** Gets the endpoint function for a slugged route of key */
type GetSluggedEndpointFn<T, Key extends string> = T extends {
	[Slug in `${string}$`]: (...args: any[]) => { [K in Key]: infer V }
}
	? V extends EndpointFunction
		? V
		: never
	: never

type Modify<T, Put extends EndpointFunction, Patch extends EndpointFunction> = 
	[Put, Patch] extends [never, never]
		? {}
		: {
			modify(id: string): T & {
				$: {
					validate(
						path?: (string | number) | (string | number)[]
					): KitValidationError[]
					// put(): ValidatedKitRequestXHR
					// patch(): ValidatedKitRequestXHR
					isModified: boolean
					errors(
						path?: (string | number) | (string | number)[]
					): KitValidationError[]
				} & ([Put] extends [never] ? {} : {
					put(): ValidatedKitRequestXHR<ReturnType<Put['xhr']>>
				}) & ([Patch] extends [never] ? {} : {
					patch(): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>>
				})
			}
		} & ([Put] extends [never] ? {} : {
			put(id: string | number, data: Input<Put>['body']): ValidatedKitRequestXHR<ReturnType<Put['xhr']>>
		}) & ([Patch] extends [never] ? {} : {
			patch(id: string | number, data: Input<Patch>['body']): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>>
		})

export type RuneAPI<T, G, A> = {
	/** Calls GET */
	get(): Promise<T[]>

	list: T[]
	Paginator: new (count?: number) => Paginator<T>
} 
& (A extends { POST: EndpointFunction } ? Create<T, A['POST']> : {}) 
& (A extends Slugged<{ GET: infer P }>
	? P extends EndpointFunction
		? {
				/** Calls id$(...).GET */
				get(id: string | number): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
			}
		: {}
	: {}) 
& Modify<T, GetSluggedEndpointFn<A, 'PUT'>, GetSluggedEndpointFn<A, 'PATCH'>> 
& (G extends Record<string, any> ? { groups: Record<keyof G, T[]> } : {}) 
& {
	[key: string]: T
}
