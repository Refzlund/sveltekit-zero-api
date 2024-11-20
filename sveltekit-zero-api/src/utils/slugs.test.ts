import { complexSlug } from './slugs.ts'

Deno.test('slugs', () => {
	let m: RegExpMatchArray | null
	let key = '[a]-[b]$'
	let args = ['shiba', 'giraffe']

	// expect: shiba-giraffe

	if ((m = key.match(complexSlug))) {
		//"[a]-[b]$": (a: string, b: string)
		let result = ''

		let k = key
		let i = 0
		do {
			result += k.slice(0, m.index!)
			result += args[i]
			k = k.slice(m[0].length + m.index!)
			i++
			console.log({ m, k })
		} while ((m = k.match(complexSlug)))
		result += k.slice(0, -1)
	}
})
