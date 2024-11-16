import { InternalServerError, OK } from 'sveltekit-zero-api/http'
import { functions } from 'sveltekit-zero-api/server'

function someFunction() {
	if (Math.random() > 0.5) {
		throw new InternalServerError({
			code: 'unlucky_call',
			error: 'Unlucky'
		})
	}
	return new OK({ message: 'ok' })
}

export const PATCH = functions({
	someFunction
})