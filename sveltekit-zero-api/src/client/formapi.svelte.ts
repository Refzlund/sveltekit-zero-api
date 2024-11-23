import { type Writable, toStore } from 'svelte/store'
import { enhance as svelteEnhance } from '$app/forms'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

import { proxyCrawl } from '../utils/proxy-crawl.ts'
import { MapDeepTo } from '../utils/types.ts'
import { EndpointFunction } from '../server/endpoint.ts'
import { KitRequestXHR } from '../endpoint-proxy.ts'

interface ActionOptions<T extends Record<PropertyKey, any>> {
	/** @default true */
	enhance?: boolean | Parameters<typeof svelteEnhance>[1]

	/** $id(...).GET/PUT */
	id?: string

	value?: T
}

interface FormAPIOptions {
	get?: (id: string) => KitRequestXHR
	put?: (id: string, formData: any) => KitRequestXHR
	post?: (formData: any) => KitRequestXHR
	/** If provided, will use `PATCH` instead of `PUT` and only send changed data from `GET`. */
	patch?: (id: string, formData: any) => KitRequestXHR
	/** .POST, .[id]/GET .[id]/PUT */
	apiRoute?: {
		POST: EndpointFunction
		[slug: `${string}$`]: (id: string) =>
			| undefined
			| {
					GET?: EndpointFunction
					/** Will use `PUT` over `PATCH` */
					PUT?: EndpointFunction
					/** Will `PATCH` if there's not `PUT` */
					PATCH?: EndpointFunction
			  }
	}
	onSubmit?(method: 'POST' | 'PUT' | 'PATCH', data: FormData): FormData
	onRequest?(req: KitRequestXHR): void
	validation: unknown
	enhance: boolean | Parameters<typeof svelteEnhance>[1]
}

interface FormAPIError {
	message: string
}

type FormAPIAction = (node: HTMLInputElement) => void

type FormAPI<T extends Record<PropertyKey, any>> = Writable<T> &
	((node: HTMLFormElement, options?: ActionOptions<T>) => void) & {
		$: MapDeepTo<T, FormAPIAction>
		errors: MapDeepTo<T, FormAPIError>
		submit: () => Promise<Response>
		/** Form bound to this Form Rune */
		form: HTMLFormElement
		request: {
			progress: number
			status: 'none' | 'pending' | 'error' | 'sending' | 'cancelled' | 'done'
			uploaded: number
			totalSize: number
		}
	}

export function formAPI<T extends Record<PropertyKey, any>>(
	options: FormAPIOptions | NonNullable<FormAPIOptions['apiRoute']>
) {
	let full = (
		String(options) === 'APIProxy' ? options : (<FormAPIOptions>options).apiRoute
	) as FormAPIOptions['apiRoute']
	let apis = {
		GET: ('get' in options ? options.get : (id: string) => full?.slug$(id)?.GET?.xhr()!)!,
		PUT: ('put' in options
			? options.put
			: (id: string, formData: any) => full?.slug$(id)?.PUT?.xhr(formData)!)!,
		POST: ('post' in options ? options.post : (formData: any) => full?.POST?.xhr(formData)!)!,
		PATCH: ('patch' in options
			? options.patch
			: (id: string, formData: any) => full?.slug$(id)?.PATCH?.xhr(formData)!)!
	}

	/** current id of form content */
	let id = $state() as string | undefined

	let value = $state({} as Record<PropertyKey, any>)
	let errors = $state({})

	let request = $state({
		progress: 0,
		status: 'none',
		uploaded: 0,
		totalSize: 0
	})

	let form = $state() as HTMLFormElement

	let inputMap = new SvelteMap<PropertyKey[], SvelteSet<HTMLInputElement>>()
	let mapped = new SvelteSet<PropertyKey[]>()

	function getParent(
		keys: PropertyKey[],
		/** `null` returns undefined if missing, `make` creates parent tree, `nearest` returns nearest parent in the tree */
		reaction: null | 'make' | 'nearest'
	) {
		let parent = value as Record<PropertyKey, any> | Array<any>
		let property = keys[keys.length - 1]

		for (let i = 0; i < keys.length - 1; i++) {
			let key = keys[i]
			if (!parent[key]) {
				if (reaction === null) return undefined
				if (reaction === 'nearest') return parent

				let childKey = keys[i + 1] ?? property
				parent[key] = typeof childKey === 'number' ? Array(childKey) : {}
			}
			parent = parent[key]
		}
		return parent
	}

	function updateNode(node: HTMLInputElement, v: any) {
		if (node.type === 'checkbox') {
			node.checked = v ?? null
		} else if (node.type === 'file') {
			node.files = v ?? null
		} else {
			node.value = v ?? null
		}
	}

	// Logic to update value-inputs is at the root-level
	// of FormAPI to be called on component initialization
	$effect(() => {
		for (const keys of mapped) {
			for (const node of inputMap.get(keys)!) {
				getParent(keys, 'nearest') // updates the below $effect, when structure changes
				$effect(() => {
					updateNode(node, getParent(keys, null)?.[keys[keys.length - 1]])
				})
			}
		}
	})

	const proxies = {
		$: proxyCrawl({
			matchStringedKeys: true,
			numberedKeys: true,
			apply(state) {
				// ex.   <input use:form.$.nested.string />
				let propertyKeys = [...state.keys, state.key] as PropertyKey[]
				const [node] = state.args as [HTMLInputElement]

				const propertiesStr = propertyKeys.join('.')
				for (const keys of mapped) {
					if (keys.join('.') === propertiesStr) propertyKeys = keys
				}

				let set = inputMap.get(propertyKeys)
				if (!set) {
					set = new SvelteSet()
					inputMap.set(propertyKeys, set)
					mapped.add(propertyKeys)
				}
				set.add(node)

				function getValue() {
					return node.type === 'checkbox'
						? node.checked
						: node.type === 'file'
						? node.files
						: node.value !== null && node.value !== ''
						? node.value
						: undefined
				}

				function updateParent() {
					getParent(propertyKeys, 'make')![propertyKeys[propertyKeys.length - 1]] = getValue()
				}

				const initialValue = getValue()
				if (initialValue !== undefined) {
					getParent(propertyKeys, 'make')![propertyKeys[propertyKeys.length - 1]] ??= initialValue
				}

				node.addEventListener('input', updateParent)
				return {
					destroy() {
						node.removeEventListener('input', updateParent)
						set.delete(node)
						if (set.size === 0) {
							inputMap.delete(propertyKeys)
							mapped.delete(propertyKeys)
						}
					}
				}
			}
		}),
		errors: proxyCrawl({
			get(state) {}
		})
	}

	const formEnhance = ((node: HTMLFormElement, actionOptions: ActionOptions<T> = {}) => {
		let { enhance = true, id: _id, value: _value } = actionOptions

		if (_value) {
			Object.assign(value, _value)
		}
		id = _id

		if (enhance) {
			if (!node.getAttribute('method')) node.setAttribute('method', 'POST')
			svelteEnhance(node, enhance === true ? undefined : enhance)
		}

		form = node
		form.enctype = 'multipart/form-data'

		form.addEventListener(
			'submit',
			(e) => {
				e.preventDefault()
				e.stopPropagation()
				e.stopImmediatePropagation()
				submit()
			},
			{ capture: true }
		)

		let inputs = node.querySelectorAll('input[name]')

		function applyCrawl(inputs: HTMLElement[]) {
			for (const input of inputs) {
				const isValid = input.tagName === 'INPUT'
				if (!isValid || !('getAttribute' in input)) continue

				let name = input.getAttribute('name')
				if (!name) continue

				let crawler = proxies.$
				for (const key of name.split('.')) crawler = crawler[key]
				crawler(input)
			}
		}

		applyCrawl(inputs as any)

		const observer = new MutationObserver((mutations) => mutations.map((v) => applyCrawl(v.addedNodes as any)))
		observer.observe(node, {
			childList: true,
			subtree: true
		})

		return {
			destroy() {
				observer.disconnect()
			},
			update(actionOptions: ActionOptions<T>) {
				let { id: _id, value: _value } = actionOptions
				if (_value) {
					Object.assign(value, _value)
				}
				id = _id
			}
		} as any
	}) as FormAPI<T>

	Object.assign(formEnhance, {
		...toStore(
			() => value,
			(v) => (value = v)
		)
	})

	Object.defineProperties(formEnhance, {
		value: {
			get: () => value,
			set: (v: T) => (value = v)
		},
		$: { get: () => proxies.$ },
		errors: { get: () => proxies.errors },
		submit: { get: () => submit },
		form: { get: () => form },
		request: { get: () => request }
	})

	function submit() {
		const method = id === undefined || id === null ? 'POST' : 'patch' in apis ? 'PATCH' : 'PUT'

		let data = new FormData(form)

		if ('onSubmit' in options) {
			data = options.onSubmit!(method, data)
		}

		const args: [any, any] = id === undefined || id === null ? ([data,,]) : ([id, data])
		const req = apis[method]!(...args)

		if ('onRequest' in options) {
			options.onRequest!(req)
		}

		req
			.xhrInit(() => request = {
				progress: 0,
				status: 'pending',
				totalSize: 0,
				uploaded: 0
			})
			.uploadProgress((e) => request = {
				progress: e.loaded / e.total,
				status: 'sending',
				totalSize: e.total,
				uploaded: e.loaded
			})
			.xhrError(() => request.status = 'error')
			.success(() => request.status = 'done')
	}

	return formEnhance
}
