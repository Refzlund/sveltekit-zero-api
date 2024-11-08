import { type Writable, toStore } from 'svelte/store'
import { enhance as svelteEnhance } from '$app/forms'

import { proxyCrawl } from './utils/proxy-crawl'

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
	let inputs = new WeakSet()

	const proxies = {
		$: proxyCrawl({
			apply(state) {
				// ex.   <input use:form.$.nested.string />
				const propertyParents = [...state.keys] as PropertyKey[]
				const property = propertyParents.pop()!
				const [node] = state.args as [HTMLInputElement]
				inputs.add(node)

				function getParent(make = true) {
					let parent = value as Record<PropertyKey, any> | Array<any>

					for (let i = 0; i < propertyParents.length; i++) {
						let key = propertyParents[i]
						if (!parent[key]) {
							if (!make) return undefined

							let childKey = propertyParents[i + 1] ?? property
							parent[key] = typeof childKey === 'number' ? Array(childKey) : {}
						}
						parent = parent[key]
					}

					return parent
				}

				function updateSelf() {
					if (node.type === 'checkbox') {
						node.checked = getParent(false)?.[property] ?? null
					} else {
						node.value = getParent(false)?.[property] ?? null
					}
				}

				function updateParent() {
					getParent(true)![property] = node.value
				}

				let unsub = () => {}

				try {
					$effect(updateSelf)
				} catch (error) {
					// * Doesn't work
					// TODO move $effect out of this apply() fn and make inputs reactive via a ex. Map with WeakArray
					/*
						let map = new Map<string, WeakSet<HTMLInputElement>>()
						let ver = $state({} as Record<string, number>)

						$effect(() => {
							for(const key of map.keys()) {
								ver[key]
								untrack(() => {
									map.get(key)?.forEach(node => {
										
									})
								})
							}
						})
					
					*/
					unsub = formEnhance.subscribe(updateSelf)
				}

				node.addEventListener('input', updateParent)
				return {
					destroy() {
						inputs.delete(node)
						unsub()
						node.removeEventListener('input', updateParent)
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