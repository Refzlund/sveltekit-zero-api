import { BadRequest } from "./http.ts";
import { ParseKitEvent, type KitEvent } from './kitevent.ts'
export function parseJSON() {
	return async (event: KitEvent) => {
		let json: Record<PropertyKey, any> | Array<any>
		
		let contentTypes = ['application/json', 'multipart/form-data'] as const
		let contentType = event.request.headers.get('content-type')?.toLowerCase() as typeof contentTypes[number]

		if(!contentType || !contentTypes.includes(contentType)) {
			return new BadRequest({
				code: 'bad_content_type',
				error: 'Bad Content-Type header',
				details: {
					expected: contentTypes,
					received: (contentType as string) || 'undefined'
				}
			})
		}

		if (contentType == 'multipart/form-data') {
			try {
				const formData = await event.request.formData()
				json = Object.fromEntries(formData)
			} catch (error) {
				return new BadRequest({
					code: 'invalid_formdata',
					error: 'Could not parse FormData',
					details: error
				})
			}
		}
		else {
			try {
				json = await event.request.json()
			} catch (error) {
				return new BadRequest({
					code: 'invalid_json',
					error: 'Could not parse JSON',
					details: error
				})
			}
		}

		return new ParseKitEvent<
			Record<string | number, any> | Array<any>
		>({ body: json })
	}
}