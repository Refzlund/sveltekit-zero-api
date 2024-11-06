import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
	return {
		mobile: event.locals.mobile
	}
}