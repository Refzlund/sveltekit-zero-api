import type { APIRoutes } from "../.svelte-kit/types/src/api.d.ts"
import { createAPIProxy } from '@scope/sveltekit-zero-api/client'

const proxy = createAPIProxy<APIRoutes>()

const api = proxy.api

export default api



api.test.someFunction().then(v => console.log({v})).catch(v => {
	console.log(v.body)
})

api.slugged$('id:slugged').deep['<[a]--[b]>$']('shiba', 'giraffe').POST().OK((res) => {
	console.log(res)
})
