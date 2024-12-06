import { EndpointFunction } from '../../server/endpoint'
import { Slugged } from '../../utils/slugs'
import { ErrorPath, KitValidationError, ValidatedKitRequestXHR } from '../errors'
import { Paginator } from './paginator.svelte'

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
			errors: {
				(path?: ErrorPath): KitValidationError[]
			} & KitValidationError[]
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
					isModified: boolean
					errors: {
						(path?: ErrorPath): KitValidationError[]
					} & KitValidationError[]
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
	list: T[]
	Paginator: new (count?: number) => Paginator<T>
}
& (A extends { GET: EndpointFunction } ? {
	/** Calls GET */
	get(): Promise<T[]>
} : {})
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
& ([G] extends [never] ? {} : G extends Record<string, any> ? { groups: Record<keyof G, T[]> } : {}) 
& {
	[key: string]: T
}
