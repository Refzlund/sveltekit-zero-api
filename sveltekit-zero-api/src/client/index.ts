import type { EndpointResponse } from '../server/endpoint'
import type { Functions } from '../server/functions.type'

export type ServerType<T extends { GET?; POST?; PUT?; PATCH?; DELETE?; HEAD?; OPTIONS? }> = ({
	[K in keyof T as T[K] extends EndpointResponse<any> ? K : never]: T[K] extends (...args: any[]) => {
		use: infer U
	} ? U : never
}) & (T extends { PATCH: (...args: any[]) => { use(): infer K } } ? K extends Functions<any> ? K : {} : {})

export { createAPIProxy } from './api-proxy'
