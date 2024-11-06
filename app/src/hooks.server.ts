import type { Handle } from '@sveltejs/kit'
import { UAParser } from 'ua-parser-js'

export async function handle({ event, resolve }: Parameters<Handle>[0]): Promise<Response>  {
	const userAgent = new UAParser(event.request.headers.get('user-agent') || '')
	event.locals.mobile = ['mobile', 'wearable'].includes(userAgent.getDevice().type || '')

	const response = await resolve(event)
	return response
}