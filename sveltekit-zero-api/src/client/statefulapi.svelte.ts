import { Promisify } from '../utils/types'

type StatefulAPI = {
	/** In `ms` - time until being able to fetch again */
	cooldown: number
} | {
	/** In `ms` - time it takes to fetch (resets when a new fetch is called) */
	warmup: number
}

export function statefulAPI<Args extends any[], Result>(
	cb: (...args: Args) => Promise<Result> | Result,
	options: StatefulAPI
) {
	const { cooldown, warmup } = options as { cooldown?: number, warmup?: number}

	let timer = null as null | ReturnType<typeof setTimeout>
	
	let promise: Promise<Result> | undefined
	let resolve: (value: Result) => void

	function newPromise() {
		promise = new Promise(r => resolve = r)
	}

	$effect(() => {
		state.fetch(...state.args)
	})

	const state = $state({
		args: [] as any as Args,
		result: undefined as undefined | Result,
		isLoading: false,
		fetch: async (...args: Args) => {
			state.isLoading = true
			
			const run = async () => {
				const result = await cb(...args)
				state.result = result
				resolve(result)
				promise = undefined
				state.isLoading = false
			}

			if (cooldown && promise) {
				return promise
			} else if (cooldown) {
				newPromise()
				await new Promise((res) => setTimeout(res, cooldown))
			}
			else if (warmup) {
				if (timer) {
					clearTimeout(timer)
				}
				if(!promise) {
					newPromise()
				}
				timer = setTimeout(run, warmup)
				return promise
			}

			await run()
			return state.result
		}
	})

	return state
}