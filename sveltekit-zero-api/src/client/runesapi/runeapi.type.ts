import { Endpoint } from '../../server/endpoint'
import { Slugged } from '../../utils/slugs'
import {
	ErrorPath,
	KitValidationError,
	ValidatedKitRequestXHR,
} from '../errors'
import { Paginator } from './paginator.svelte'

type Input<P extends Endpoint> = P extends Endpoint<infer Input> ? Input : never

interface Create<T, P extends Endpoint> {
	post(data: Input<P>['body']): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
	create(): T & {
		$: {
			validate(
				path?: (string | number) | (string | number)[]
			): KitValidationError[]
			post(): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
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
	? V extends Endpoint
	? V
	: never
	: never

type Modify<T, Put extends Endpoint, Patch extends Endpoint, Delete extends Endpoint> = [
	Put,
	Patch
] extends [never, never] ? {} :
	& {
		modify(id: string): T & {
			$: {
				validate(
					path?: (string | number) | (string | number)[]
				): KitValidationError[]
				isModified: boolean
				errors: {
					(path?: ErrorPath): KitValidationError[]
				} & KitValidationError[]
			}
			& ([Put] extends [never] ? {} : { put(): ValidatedKitRequestXHR<ReturnType<Put['xhr']>> })
			& ([Patch] extends [never] ? {} : { patch(): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>> })
			& ([Delete] extends [never] ? {} : { delete(): ReturnType<Delete['xhr']> })
		}
	}
	& ([Put] extends [never] ? {} : {
		put(
			id: string | number,
			data: Input<Put>['body']
		): ValidatedKitRequestXHR<ReturnType<Put['xhr']>>
	})
	& ([Patch] extends [never] ? {} : {
		patch(
			id: string | number,
			data: Input<Patch>['body']
		): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>>
	})

export type RuneAPI<T, G, A> = 
	& {
		[Symbol.iterator](): ArrayIterator<T>
		list: T[]
		entries: [string, T][]
		keys: string[]
		length: number
		has: (key: string) => boolean
		Paginator: new (count?: number) => Paginator<T>
	}
	& (A extends { GET: Endpoint }
		? {
			/** Calls GET */
			get(): Promise<T[]>
		} : {}) 
	& (A extends { POST: Endpoint } ? Create<T, A['POST']> : {})
	& (A extends Slugged<{ GET: infer P }>
		? P extends Endpoint
			? {
				/** Calls id$(...).GET */
				get(id: string | number): ReturnType<P['xhr']>
			}
			: {}
		: {})
	& (A extends Slugged<{ DELETE: infer P }>
		? P extends Endpoint
			? {
				/** Calls id$(...).DELETE */
				delete(id: string | number): ReturnType<P['xhr']>
			} 
			: {} 
		: {})
	& Modify<T, GetSluggedEndpointFn<A, 'PUT'>, GetSluggedEndpointFn<A, 'PATCH'>, GetSluggedEndpointFn<A, 'DELETE'>> 
	& ([G] extends [never]
		? {}
		: G extends Record<string, any>
		? { groups: Record<keyof G, T[]> }
		: {}) 
	& {
		[key: string]: T
	}
