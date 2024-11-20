import { BadRequest } from '../http.ts'
import { ParseKitEvent, type KitEvent } from '../kitevent.ts'

/**
 * Parse incoming JSON/FormData from the body.
 * Returns BadRequest if it is not any of those content-type's.
 * 
 * @example
 * 
 * const POST = endpoint(
 * 	parseJSON,
 * 	(event) => {
 * 		event.body // <- Parsed JSON
 * 	}
 )
 */
export async function parseJSON<T extends Record<string | number, unknown> | Array<unknown> | string | number>(
	event: KitEvent
) {
	let json: T

	let contentTypes = ['application/json', 'multipart/form-data'] as const
	let contentType = event.request.headers.get('content-type') as (typeof contentTypes)[number]

	if (!contentType || !contentTypes.some((v) => contentType.includes(v))) {
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
			json = Object.fromEntries(formData) as T
		} catch (error) {
			return new BadRequest({
				code: 'invalid_formdata',
				error: 'Could not parse FormData',
				details: error
			})
		}
	} else {
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

	return new ParseKitEvent<T>({ body: json })
}
