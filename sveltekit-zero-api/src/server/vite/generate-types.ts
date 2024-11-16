import { getEndpointFiles } from './get-endpoint-files.ts'
import { serializeFiles } from './serialize-files.ts'

export function generateTypes(path: string, directory: string) {
	let files = getEndpointFiles(path, directory)
	let serializedFiles = serializeFiles(files)

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

	function typePath(key: string | null, indent = 0) {
		return {
			type: null as string | null,
			children: {},
			indent,
			toString() {
				let children = Object.values(this.children).map((v) => v.toString())
				let tabs = '\t'.repeat(indent)
				let str = ''

				if (key) {
					let m: RegExpMatchArray | null
					if ((m = key.match(optionalSlug))) {
						str += `'${m[1]}$": (${m[1]}?: string | null | undefined) => `
					} else if ((m = key.match(restSlug))) {
						str += `"${m[1]}$": (...${m[1]}: string[]) => `
					} else if ((m = key.match(simpleSlug))) {
						str += `"${m[1]}$": (${m[1]}: string) => `
					} else if ((m = key.match(complexSlug))) {
						let k = key
						let complex: string[] = []
						do {
							complex.push(m[1])
							k = k.replace(complexSlug, '')
						} while ((m = k.match(complexSlug)))
						str += `"${key}$": (${complex.map((v) => v + ': string').join(', ')}) => `
					} else {
						str += `"${key}": `
					}
				}
				if (children.length) str += `{\n\t${tabs}${children.join(`,\n\t${tabs}`)}\n${tabs}}`
				if (this.type && children.length) str += ' & '
				if (this.type) str += this.type
				return str
			}
		} as TypePath
	}

	let root = typePath(null)

	for (let [file, serialized] of serializedFiles) {
		let current = root
		for (let key of serialized) {
			if (!current.children[key]) {
				current = current.children[key] = typePath(key, current.indent + 1)
			} else {
				current = current.children[key]
			}
		}
		current.type = `S<typeof import('.${file}')>`
	}

	return root.toString()
}