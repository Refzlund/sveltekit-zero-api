import { InternalServerError, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions, SSE, type KitEvent } from 'sveltekit-zero-api/server'
import { stream } from 'sveltekit-zero-api/stream'

function someFunction(event: KitEvent, n: number = Math.random()) {
	if (n > 0.5) {
		throw new InternalServerError({
			code: 'unlucky_call',
			error: 'Unlucky'
		})
	}
	return new OK({ message: 'ok' })
}


function streamingData() {
	let message = 'I want to tell the world, that I love my wife, my Shiba-boo'.split(' ')
	let dataStream = stream(async function*() {
		for(let item of message) {
			yield { data: item }
			await new Promise((res) => setTimeout(res, 500))
		}
	})
	return new OK(dataStream)
}


export const PUT = endpoint(
	streamingData
)

export const GET = endpoint(
	new SSE(async function*(event) {
		let message = 'I want to tell the world, that I love my wife, my Shiba-boo'.split(' ')
		for(let item of message) {
			if(Math.random() > 0.5) {
				yield SSE.event('event1', { data: item })
			} else {
				yield SSE.event('event2', { data2: item })
			}
			await new Promise((res) => setTimeout(res, 500))
		}
	})
)


export const PATCH = functions({
	someFunction,
	streamingData
})