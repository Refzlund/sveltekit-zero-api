import { type Writable, toStore } from 'svelte/store'
import { enhance as svelteEnhance } from '$app/forms'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

import { proxyCrawl } from '../utils/proxy-crawl.ts'
import { untrack } from 'svelte'

interface Options<T extends Record<PropertyKey, any>> {
	/** @default true */
	enhance?: boolean | Parameters<typeof svelteEnhance>[1]

	/** $id(...).GET/PUT */
	id?: string

	value?: T
}

/** Takes all properties of T, and deeply ensure they become U */
type MapDeepTo<T, U> = {
	[K in keyof T]-?: NonNullable<T[K]> extends Record<PropertyKey, any> 
		? MapDeepTo<T[K], U>
		: T[K] extends any[]
			? Array<MapDeepTo<T[K][number], U>>
			: NonNullable<U>
}

interface FormAPIError {
	message: string
}

type FormAPIAction = (node: HTMLInputElement) => void

type FormAPI<T extends Record<PropertyKey, any>> = 
		& Writable<T> 
		& ((node: HTMLFormElement, options?: Options<T>) => void) 
		& { 
			$: MapDeepTo<T, FormAPIAction>
			errors: MapDeepTo<T, FormAPIError>
			submit: () => Promise<Response>
		}

export function formAPI<T extends Record<PropertyKey, any>>(
	endpoint:
		| {
				$id(id: string): {
					GET(): Promise<T>
					PUT(body: any): Promise<T>
				}
		  }
		| {
				POST(body: any): Promise<T>
		  }
) {
	let value = $state({} as Record<PropertyKey, any>)
	let errors = $state({})
	
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
				for(const keys of mapped) {
					if(keys.join('.') === propertiesStr)
						propertyKeys = keys
				}

				let set = inputMap.get(propertyKeys)
				if(!set) {
					set = new SvelteSet()
					inputMap.set(propertyKeys, set)
					mapped.add(propertyKeys)
				}
				set.add(node)

				function updateParent() {
					getParent(propertyKeys, 'make')![propertyKeys[propertyKeys.length - 1]] =
						node.type === 'checkbox' ? node.checked : node.value
				}

				node.addEventListener('input', updateParent)
				return {
					destroy() {
						node.removeEventListener('input', updateParent)
						set.delete(node)
						if(set.size === 0) {
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

	const formEnhance = ((
		node: HTMLFormElement,
		{
			enhance = true,
			id,
			value
		}: Options<T> = {}
	) => {
		if(enhance) {
			if(!node.getAttribute('method'))
				node.setAttribute('method', 'POST')
			svelteEnhance(node, enhance === true ? undefined : enhance)
		}

		let inputs = node.querySelectorAll('input[name]')

		function applyCrawl(inputs: HTMLElement[]) {
			for (const input of inputs) {
				const isValid = input.tagName === 'INPUT'
				if(!isValid || !('getAttribute' in input))
					continue

				let name = input.getAttribute('name')
				if (!name)
					continue

				let crawler = proxies.$
				for (const key of name.split('.'))
					crawler = crawler[key]
				crawler(input)
			}
		}

		applyCrawl(inputs as any)

		const observer = new MutationObserver((mutations) => 
			mutations.map((v) => applyCrawl(v.addedNodes as any))
		)
		observer.observe(node, {
			childList: true,
			subtree: true
		})

	}) as FormAPI<T>

	Object.assign(formEnhance, {
		...toStore(() => value, v => value = v),
		get value() { return value },
		set value(v: T) { value = v },
		get $() { return proxies.$ },
		get errors() { return proxies.errors },
		get submit() { return submit }
	})

	function submit() {}

	return formEnhance
}