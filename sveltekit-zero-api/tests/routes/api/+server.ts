import { endpoint, functions, parseJSON } from '../../../src/server'
import { OK } from '../../../src/server/http'

export const POST = endpoint(
	parseJSON<{ hello: 'world' | 'shiba' }>,
	() => {
		return { value: 123 as const }
	},
	(event) => {
		return new OK(event.results)
	}
) 

export const PATCH = functions({
	someFn: (event, value: number) => {
		return new OK(value)
	}
})