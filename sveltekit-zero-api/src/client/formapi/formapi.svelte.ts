import { type Writable, toStore } from 'svelte/store'
import { enhance as svelteEnhance } from '$app/forms'
import { SvelteMap, SvelteSet, SvelteDate } from 'svelte/reactivity'

import { proxyCrawl } from '../../utils/proxy-crawl'
import { MapDeepTo } from '../../utils/types'
import { EndpointFunction } from '../../server/endpoint'
import { KitRequestXHR } from '../../endpoint-proxy'

import Form from './Form.svelte'
import { parseObjectToKeys } from '../../utils/parse-keys'
import { APIProxy } from '../api-proxy'
import { objectDifference } from '../../utils/object-difference'
import { getContext } from 'svelte'

export const getFormAPI = () => getContext('formapi') as FormAPI | undefined

export interface FormAPIActionOptions<T extends Record<PropertyKey, any>> {
	/** $id(...).GET/PUT */
	id?: string | undefined

	value?: T | undefined
}

interface FormAPIOptions {
	get?: (id: string, options: RequestInit | undefined) => KitRequestXHR
	put?: (id: string, formData: any, options: RequestInit | undefined) => KitRequestXHR
	post?: (formData: any, options: RequestInit | undefined) => KitRequestXHR
	/** If provided, will use `PATCH` instead of `PUT` and only send changed data from `GET`. */
	patch?: (id: string, formData: any, options: RequestInit | undefined) => KitRequestXHR
	/** .POST, .[id]/GET .[id]/PUT */
	api?: {
		POST: EndpointFunction
		[slug: `${string}$`]: (id: string) =>
			| undefined
			| {
					GET?: EndpointFunction
					/** Will use `PUT` over `PATCH` */
					PUT?: EndpointFunction
			  }
	}
	onSubmit?(method: 'POST' | 'PUT' | 'PATCH', data: FormData): FormData | void
	onRequest?(req: KitRequestXHR): void
	/** JSON Schema for validating content */
	validation?: Record<PropertyKey, any> | false
	/** @default true */
	enhance?: boolean | Parameters<typeof svelteEnhance>[1]
}

interface FormAPIError {
	code?: string
	error?: string
}

type FormAPIAction = (node: HTMLInputElement) => void

type FormAPI<T extends Record<PropertyKey, any> = Record<PropertyKey, any>> = 
	& typeof Form
	& Writable<T> 
	& {
		action: (node: HTMLFormElement, options?: FormAPIActionOptions<T>) => void
		$: MapDeepTo<T, FormAPIAction>
		errors: MapDeepTo<T, FormAPIError>
		/** Error response from API */
		error: FormAPIError & {
			/** Amount of errors in form */
			count: number
		}
		submit: () => Promise<Response>
		reset: () => void
		/** Abort any ongoing request `formAPI` is making */
		abort: () => void
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
	options: FormAPIOptions | NonNullable<FormAPIOptions['api']>
) {
	let opts: FormAPIOptions = options instanceof APIProxy ? {} : <FormAPIOptions>options
	let full = (options instanceof APIProxy ? options : (<FormAPIOptions>options).api) as FormAPIOptions['api']	

	let apis = {
		GET: ('get' in opts ? opts.get : (id: string, options: RequestInit | undefined) => full?.slug$(id)?.GET?.xhr(null, options)!)!,
		PUT: ('put' in opts
			? opts.put
			: (id: string, formData: any, options: RequestInit | undefined) => full?.slug$(id)?.PUT?.xhr(formData, options)!)!,
		POST: ('post' in opts ? opts.post : (formData: any, options: RequestInit | undefined) => full?.POST?.xhr(formData, options)!)!,
		PATCH: opts.patch
	}

	if(opts.validation) {
		// opts.validation = ajv.compile(opts.validation)
	}

	/** If a key-value is `undefined` it hasn't been fetched. If `false` it can't be fetched. */
	let validationSchemas = {
		PUT: undefined as undefined | false,
		POST: undefined as undefined | false,
		PATCH: undefined as undefined | false
	}

	/** current id of form content */
	let id = $state() as string | undefined

	let value = $state({} as Record<PropertyKey, any>)
	/** Stores the initial content */
	let resetValue = {} as Record<PropertyKey, any>
	let errors = $state({})
	let error = $state({
		count: 0
	})

	const store = toStore(
		() => value,
		(v) => (value = v)
	)

	let request = $state({
		progress: 0,
		status: 'none',
		uploaded: 0,
		totalSize: 0
	})

	let form = $state() as HTMLFormElement

	/** A list (set) of properties that has a bound HTML Element */
	let mapped = new SvelteSet<PropertyKey[]>()
	/** Map of inputs, relative to the properties */
	let inputMap = new SvelteMap<PropertyKey[], SvelteSet<HTMLInputElement>>()

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

	function nodeDate(v: { toString(): string }, type: 'date' | 'datetime' | 'time' | 'datetime-local') {
		if(!(v instanceof Date))
			return v.toString()
		switch (type) {
			case 'date': return v.toISOString().split('T')[0]
			case 'datetime': return v.toISOString()
			case 'time': return v.toISOString().split('T')[1].split('.')[0]
			case 'datetime-local': return v.toISOString().split('.')[0]
		}
	}

	function updateNode(node: HTMLInputElement, v: any) {
		switch (node.type) {
			case 'checkbox': return node.checked = v ?? null
			case 'radio': return node.checked = v ?? null
			case 'file': return node.files = v ?? null
			case 'date': return node.value = v ? nodeDate(v, 'date') : null!
			case 'datetime': return node.value = v ? nodeDate(v, 'datetime') : null!
			case 'time': return node.value = v ? nodeDate(v, 'time') : null!
			case 'datetime-local': return node.value = v ? nodeDate(v, 'datetime-local') : null!
			default: return node.value = v ?? null
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

	/** Crawler - `$.nested.value(node)` binds node to `value.nested.value` */
	const crawl = proxyCrawl({
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

			node.addEventListener('blur', () => {
				validate(propertyKeys)
			})

			let set = inputMap.get(propertyKeys)
			if (!set) {
				set = new SvelteSet()
				inputMap.set(propertyKeys, set)
				mapped.add(propertyKeys)
			}
			set.add(node)

			function getValue() {
				return node.type === 'checkbox' ? node.checked 
					: node.type === 'file' ? node.files 
					: node.type === 'radio' ? node.checked
					: node.type === 'number' ? node.value ? parseFloat(node.value) : null
					: node.type === 'range' ? node.value ? parseFloat(node.value) : null
					: node.type === 'date' ? node.value ? new SvelteDate(node.value) : null
					: node.type === 'time' ? node.value ? new SvelteDate(node.value) : null
					: node.type === 'datetime' ? node.value ? new SvelteDate(node.value) : null
					: node.type === 'datetime-local' ? node.value ? new SvelteDate(node.value) : null
					: node.value !== null && node.value !== '' ? node.value 
					: undefined
			}

			function updateParent() {
				getParent(propertyKeys, 'make')![
					propertyKeys[propertyKeys.length - 1]
				] = getValue()
			}

			const initialValue = getValue()
			if (initialValue !== undefined) {
				getParent(propertyKeys, 'make')![
					propertyKeys[propertyKeys.length - 1]
				] ??= initialValue
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
				},
			}
		},
	})

	const formEnhance = ((node: HTMLFormElement, actionOptions: FormAPIActionOptions<T> = {}) => {
		let { id: _id, value: _value } = actionOptions

		if (_value) {
			Object.assign(value, _value)
		}
		id = _id

		opts.enhance ??= true
		if (opts.enhance === true) {
			if (!node.getAttribute('method')) node.setAttribute('method', 'POST')
			svelteEnhance(node, opts.enhance === true ? undefined : opts.enhance)
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
		
		form.addEventListener(
			'reset', (e) => {
				e.preventDefault()
				e.stopPropagation()
				e.stopImmediatePropagation()
				reset()
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

				let crawler = crawl
				for (const key of name.split('.')) crawler = crawler[key]
				crawler(input)
			}
		}

		applyCrawl(inputs as any)
		resetValue = $state.snapshot(value)

		const observer = new MutationObserver((mutations) => mutations.map((v) => applyCrawl(v.addedNodes as any)))
		observer.observe(node, {
			childList: true,
			subtree: true
		})

		return {
			destroy() {
				observer.disconnect()
			},
			update(actionOptions: FormAPIActionOptions<T>) {
				let { id: _id, value: _value } = actionOptions
				if (_value) {
					Object.assign(value, _value)
				}
				id = _id
			}
		} as any
	})

	let currentRequest: KitRequestXHR | undefined

	let _id
	$effect(() => {
		if(id === null || id === undefined) {
			if(!(_id === null || _id === undefined)) {
				value = {}
				_id = null
			}
			return
		}
		_id = id
		abort()

		const req = apis.GET!(id, undefined)
		currentRequest = req
		
		req.any(() => {
			if(currentRequest == req) {
				currentRequest = undefined
			}
		})
		.success(({body}) => {
			resetValue = body
			reset()
		})
	})

	let getMethod = () => id === undefined || id === null ? 'POST' as const : apis.PATCH ? 'PATCH' as const : 'PUT' as const
	async function submit() {
		if(!await validate()) return

		abort()
		const method = getMethod()

		let data = new FormData()

		let body = method === 'PATCH' ? objectDifference(resetValue, $state.snapshot(value)) ?? {} : $state.snapshot(value)

		for (const [key, val] of parseObjectToKeys(body)) {
			if (val instanceof FileList) {
				for (const file of val) {
					data.append(key, file)
				}
				continue
			}
			data.append(key, val)
		}

		if ('onSubmit' in opts) {
			let result = opts.onSubmit!(method, data)
			if(result)
				data = result
		}

		const args: [any, any, any] = method === 'POST' ? [data,,,] : [id, data,,]
		const req = apis[method]!(...args)

		currentRequest = req

		if ('onRequest' in opts) {
			opts.onRequest!(req)
		}

		return req.xhrInit(
			() =>
				(request = {
					progress: 0,
					status: 'pending',
					totalSize: 0,
					uploaded: 0
				})
		)
			.uploadProgress(
				(e) =>
					(request = {
						progress: e.loaded / e.total,
						status: 'sending',
						totalSize: e.total,
						uploaded: e.loaded
					})
			)
			.xhrError(() => (request.status = 'error'))
			.success(() => (request.status = 'done'))
			.error((res) => (error = res.body))
			.any(() => {
				if(currentRequest == req) {
					currentRequest = undefined
				}
			})
	}

	function reset() {
		value = structuredClone(resetValue) ?? {}
	}

	function abort() {
		currentRequest?.abort()
		currentRequest = undefined
	}

	/** return `true` if valid (or no validation schema), `false` if invalid */
	async function validate(path: PropertyKey | PropertyKey[] = []) {
		if(opts.validation === false)
			return true

		let method = getMethod()

		let schema = (opts.validation ?? validationSchemas[method]) as Record<any,any> | false

		// missing validation schema
		if (schema === undefined) {
			const opts = { headers: { 'x-json-schema': 'true' } }
			let args: [any, any, any] =
				method === 'POST' ? [undefined, opts,,] : ['-', undefined, opts]
			await apis[method]!(...args).success(({ body }) => {
				// validationSchemas[method] = ajv.compile(body)
				// schema = validationSchemas[method]
			}).clientError(({ body }) => {
				if(body.code === 'no_json_schema') {
					validationSchemas[method] = false
					schema = false
				}
			})
		}
		// cannot fetch validation schema
		if (schema === false || schema === undefined) {
			return true
		}

		// schema(value)

		return true
	}

	let proxy = new Proxy(function(){} as any, {
		set(_, key, newValue, receiver) {
			switch (key) {
				case 'value': return value = newValue
			}
			return Reflect.set(Form, key, newValue, receiver)
		},
		get(_, key, receiver) {
			switch (key) {
				case 'action': return formEnhance
				case 'value': return value
				case '$': return crawl
				case 'errors': return errors
				case 'error': return error
				case 'submit': return submit
				case 'reset': return reset
				case 'form': return form
				case 'request': return request
				case 'subscribe': return store.subscribe
				case 'set': return store.set
				case 'update': return store.update
			}
			return Reflect.get(Form, key, receiver)
		},
		apply(_, __, [target, attributes]) {
			// * Form `<UserForm ...>`
			attributes.__formApi = proxy
			return Form(target, attributes)
		}
	}) as FormAPI<T>
	
	return proxy
}
