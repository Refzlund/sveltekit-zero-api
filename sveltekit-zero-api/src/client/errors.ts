
export interface KitValidationError {
	error: string
	code: string
	details?: unknown
	path?: (string | number)[]
}