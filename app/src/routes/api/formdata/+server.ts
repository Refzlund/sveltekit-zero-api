import { BadRequest, OK } from 'sveltekit-zero-api/http'
import { endpoint, ParseKitEvent } from 'sveltekit-zero-api/server'

export const POST = endpoint(
	async (event) => {

		let formDataMime = 'multipart/form-data' as const
		let contentType = event.request.headers.get('content-type')

		if (!contentType || !contentType.includes(formDataMime)) {
			return new BadRequest({
				code: 'invalid_content_type',
				error: 'Content-Type header must be multipart/form-data',
				details: {
					expected: formDataMime,
					received: contentType || 'undefined'
				}
			})
		}

		try {
			const formData = await event.request.formData()
			return new ParseKitEvent<FormData>({ body: formData })
		} catch (error) {
			return new BadRequest({
				code: 'invalid_formdata',
				error: 'Could not parse FormData',
				details: error
			})
		}
	},
	async (event) => {
		
		console.log(Object.fromEntries(event.body))

		

		return new OK({ message: 'Form data received.', data: event.body })
	}
)
