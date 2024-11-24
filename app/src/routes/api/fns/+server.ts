import { InternalServerError, OK } from 'sveltekit-zero-api/http'
import { functions, type KitEvent } from 'sveltekit-zero-api/server'
import { stream } from 'sveltekit-zero-api/stream'

function someFunction() {
	if (Math.random() > 0.5) {
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


export const PATCH = functions({
	someFunction,
	streamingData
})
