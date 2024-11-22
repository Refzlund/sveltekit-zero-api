import { BadRequest } from '../http.ts'
import { ParseKitEvent, type KitEvent } from '../kitevent.ts'

/**
 * Parse incoming JSON/FormData from the body.
 * Returns BadRequest if it is not any of those content-type's.
 * 
 * @example
 * 
 * const POST = endpoint(
 * 	parseFormData,
 * 	(event) => {
 * 		event.body // <- Parsed JSON
 * 	}
 )
 */
export async function parseFormData<T extends Record<string | number, unknown> | Array<unknown> | string | number>(
	event: KitEvent
) {
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
		return new BadRequest(
			{
				code: 'invalid_formdata',
				error: 'Could not parse FormData',
				details:
					error !== null && typeof error === 'object' && 'toString' in error ? error.toString() : error
			},
			{ cause: error }
		)
	}
}
