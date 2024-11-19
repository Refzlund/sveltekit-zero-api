import { OK } from 'sveltekit-zero-api/http'
import { endpoint, ParseKitEvent } from 'sveltekit-zero-api/server'

export const POST = endpoint(
	() => {},
	async (event) => {
		
		for await (const chunk of event.request.body) {
			console.log({ chunk })
		}

		return new OK({ message: 'Video uploaded.' })
	}
)
