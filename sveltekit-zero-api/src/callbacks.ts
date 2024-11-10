import { KitResponse } from "./server/http.ts"

export async function callCallback(
	result: KitResponse, 
	statusText: string, 
	cb: (response: KitResponse) => any
) {
	console.log(cb)
	if (statusText === result.statusText) {
		return await cb(result)
	}
	if (result.status >= 100 && result.status < 200 && statusText === 'informational') {
		return await cb(result)
	}
	if (result.status >= 200 && result.status < 300 && statusText === 'success') {
		return await cb(result)
	}
	if (result.status >= 300 && result.status < 400 && statusText === 'redirect') {
		return await cb(result)
	}
	if (result.status >= 400 && result.status < 500 && statusText === 'clientError') {
		return await cb(result)
	}
	if (result.status >= 500 && result.status < 600 && statusText === 'serverError') {
		return await cb(result)
	}
	if (result.status >= 400 && result.status < 600 && statusText === 'error') {
		return await cb(result)
	}
}