import { KitRequestXHR } from '../endpoint-proxy'
import { Promisify } from '../utils/types'

export interface KitValidationError {
	error: string
	code: string
	details?: unknown
	path?: (string | number)[]
}

export type ValidatedKitRequestXHR<T extends KitRequestXHR = KitRequestXHR> =
	Promisify<T, KitValidationError[]>