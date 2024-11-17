import type { ServerType as S } from 'sveltekit-zero-api/client'

export type APIRoutes = {
	"api": S<typeof import('./routes/api/+server.ts')>
}