import { generateTypes } from '../src/server/generation/generate-types-file.ts'

Deno.test('route traversal', () => {
	console.log(generateTypes(import.meta.dirname!, 'routes'))

	/*
	
	import type { ServerType as S } from 'sveltekit-zero-api/client'

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
