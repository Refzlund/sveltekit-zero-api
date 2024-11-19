import type { APIRoutes } from './api.d'
import { createAPIProxy } from '../../sveltekit-zero-api/src/client/api-proxy'

const proxy = createAPIProxy<APIRoutes>() as APIRoutes

const api = proxy.api

export default api
