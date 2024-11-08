import * as http from './http.ts'

Deno.test('test', () => {
	const response = new http.OK()	
	throw response
})
