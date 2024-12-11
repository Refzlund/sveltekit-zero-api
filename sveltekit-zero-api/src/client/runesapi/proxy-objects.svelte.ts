import { RuneAPI } from '.'
import { EndpointValidator, ErrorPath, KitValidationError } from '../errors'
import { getProxyModified, objectProxy } from '../object-proxy.svelte'
import { RuneAPIInstance } from './instance.svelte'

export function createProxyObject(
	instanceproxy: RuneAPI, 
	id: string | number | null,
	instance: RuneAPIInstance
) {
	const item = $derived(id === null ? {} : instanceproxy[id])
	const proxiedObject = objectProxy({
		get ref() {
			return item as Record<PropertyKey, unknown>
		}
	})
	
	const modified = getProxyModified(proxiedObject.proxy)
	const isModified = $derived(!!Object.keys($state.snapshot(modified)).length)

	const validator = EndpointValidator.fromEndpoint(instance.api.POST).then(v => {
		if (v) return v.stateful()
	})

	const actions = {
		post() {
			return instance.crud.POST(proxiedObject.proxy)
		},
		get isModified() {
			return isModified
		},
		async validate(path?: ErrorPath) {
			return validator.then(v => v?.validate(path))
		},
		errors(path?: ErrorPath) {
			let errors = $state([] as KitValidationError[])
			validator.then(v => {
				if(v) {
					errors = v.errors(path)
				}
			})
			return errors
		}
	}

	return new Proxy(proxiedObject.proxy, {
		get(target, p) {
			if (p === '$') {
				return actions
			}
			return proxiedObject.proxy[p]
		},
		set(target, p, newValue, receiver) {
			proxiedObject.proxy[p] = newValue
			return true
		}
	})
}