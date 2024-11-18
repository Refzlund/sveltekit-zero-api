import { InternalServerError, OK } from '@scope/sveltekit-zero-api/http'
import { functions } from '@scope/sveltekit-zero-api/server'

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