import { KitRequestXHR } from '../endpoint-proxy'
import { Promisify } from '../utils/types'

export type ErrorPath = string | number | (string | number)[]

export interface KitValidationError {
	error: string
	code: string
	details?: unknown
	path: (string | number)[]
}

export type ValidatedKitRequestXHR<T extends KitRequestXHR = KitRequestXHR> =
	Promisify<T, KitValidationError[]>

const path = Symbol('formapi.path')
/** Matches and "caches" path seperated by . */
export function matchPath(obj: KitValidationError, str: string) {
	obj[path] ??= obj.path.join('.')
	return obj[path] === str
}