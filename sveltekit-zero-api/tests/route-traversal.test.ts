import * as fs from 'node:fs'
import { getEndpointFiles } from "../src/server/vite/get-endpoint-files.ts";
import { serializeFiles } from "../src/server/vite/serialize-files.ts";

Deno.test('route traversal', () => {

	let files = getEndpointFiles(import.meta.dirname!, 'routes')
	let serializedFiles = serializeFiles(files)

	// console.log(JSON.stringify(serializedFiles, null, 4))

	interface TypePath {
		type: string | null
		children: { [key: string]: TypePath }
		indent: number
		toString(): string
	}

	const optionalSlug = /^\[\[([^\]]+)\]\]$/
	const restSlug = /^\[\.\.\.([^\]]+)\]$/
	const simpleSlug = /^\[([^\]]+)\]$/
	const complexSlug = /\[([^\]]+)\]/

	function typePath(
		key: string | null,
		indent = 0
	) {
		return {
			type: null as string | null,
			children: {},
			indent,
			toString() {
				let children = Object.values(this.children).map((v) => v.toString())
				let tabs = '\t'.repeat(indent)
				let str = ''

				if(key) {
					let m: RegExpMatchArray | null
					if((m = key.match(optionalSlug))) {
						str += `"${m[1]}$": (${m[1]}?: string | null | undefined) => `
					}
					else if ((m = key.match(restSlug))) {
						str += `"${m[1]}$": (...${m[1]}: string[]) => `
					}
					else if ((m = key.match(simpleSlug))) {
						str += `"${m[1]}$": (${m[1]}: string) => `
					}
					else if ((m = key.match(complexSlug))) {
						let k = key
						let complex: string[] = []
						do {
							complex.push(m[1])
							k = k.replace(complexSlug, '')
						} while ((m = k.match(complexSlug)))
						str += `"${key}$": (${complex.map(v => v + ': string').join(', ')}) => `
					}
					else {
						str += `"${key}": `
					}
				}
				if(children.length)
					str += `{\n\t${tabs}${children.join(`,\n\t${tabs}`)}\n${tabs}}`
				if(this.type && children.length)
					str += ' & '
				if(this.type)
					str += this.type
				return str
			}
		} as TypePath
	}

	let root = typePath(null)

	for (let [file, serialized] of serializedFiles) {
		let current = root
		for (let key of serialized) {
			if (!current.children[key]) {
				current = current.children[key] = typePath(
					key,
					current.indent + 1
				)
			} else {
				current = current.children[key]
			}
		}
		current.type = `S<typeof import('.${file}')>`
	}

	console.log(root.toString())

	/*
	
	import type { ServerType as S } from 'sveltekit-zero-api/client'
	import * as S0 from '...'

	type Routes = {

		"api": {
			"users": {
				"user-[a]$": (a: string) => {
				
				} & S<S4>
				"<[id]>$": (id: string) => {
				
				} & S<S5>
			} & S<S1>
		} & S<S0>
		"others$": (others: string) => {
			"[a]+[b]$": (a: string, b: string) => {
			
			} & S<S6>
		} & S<S2>
		"articles": {
			"rest$": (...rest: string[]) => {
			
			} & S<S7>
		} & S<S3>
			
	}
	
	*/

	// console.log(JSON.stringify(routes, null, 4))
})
