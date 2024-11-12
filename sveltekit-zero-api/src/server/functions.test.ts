import { Simplify } from './../utils/types.ts'
import { functions, GenericFn } from './functions.ts'
import { BadRequest, OK } from './http.ts'
import { FakeKitEvent, KitEvent } from './kitevent.ts'

// TODO   Make sure to test various response types on frontend: strings, numbers, readable streams, etc.
// TODO   If attempting to access `response.body.` and it wasn't JSON, warn the user in the console that only JSON gets parsed to body.
// TODO   For KitResponse — maybe have Body be ReadableStream if not JSONified, and then show properties .json(), .text(), .blob(), etc.

Deno.test('functions', async () => {
	interface Input {
		name: string
		age: number
	}

	function someFn<T extends Simplify<Input>>(event: KitEvent, input: T) {
		if (Math.random() > 0.5) {
			// return new BadRequest({ code: 'invalid', error: 'You are quite the unlucky fellow.' })
		}

		if (Math.random() > 0.5) {
			return new OK(null)
		}

		return new OK({
			providedData: input
		})
	}

	const PATCH = functions({
		someFn,
		specificFn: (event) =>
			new GenericFn(<const T extends Input>(input: T) => GenericFn.return(someFn(event, input)))
	})

	let fns = PATCH.$(new FakeKitEvent())

	let result = await fns.someFn({ name: 'Shiba', age: 21 }).then(v => v).catch(err => err)

	let result2 = await fns.specificFn({ name: 'a', age: 69.69 })

	console.log({result, result2})
})
