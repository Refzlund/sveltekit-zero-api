import { Endpoint } from '../../server/endpoint'
import { RuneAPIInstance } from './instance.svelte'

export function createInstanceCRUD(instance: RuneAPIInstance) {
	return {
		async GET(key?: string) {
			if (typeof key !== 'undefined') {
				const endpoint = instance.api.id$!(key).GET as Endpoint
				return endpoint.xhr().success(({ body }) => instance.set(body))
			}
			return instance.api.GET?.xhr().success(({ body }) => instance.set(body))
		},
		async POST(data: unknown) {
			const endpoint = instance.api.POST as Endpoint
			const revert =
				instance.discriminator.temp || instance.discriminator.set
					? instance.discriminator.temp?.(data) || instance.discriminator.set!(data)
					: instance.set(data)

			return endpoint.xhr(data).error(revert).success(({ body }) => {
				if (instance.discriminator.temp) {
					revert()
				}
				instance.set(body)
			})
		},
		async PUT(key: string, data: unknown) {
			const endpoint = instance.api.id$!(key).PUT as Endpoint
			const revert = instance.set(data)
			return endpoint.xhr(data).error(revert).success(({ body }) => instance.set(body))
		},
		async PATCH(key: string, data: unknown) {
			const endpoint = instance.api.id$!(key).PATCH as Endpoint
			// TODO Merge instead of set
			const revert = instance.set(data)
			return endpoint.xhr(data).error(revert)
		},
		async DELETE(key: string) {
			const endpoint = instance.api.id$!(key).DELETE as Endpoint
			const revert = instance.remove(key)
			return endpoint.xhr().error(revert)
		}
	}
}