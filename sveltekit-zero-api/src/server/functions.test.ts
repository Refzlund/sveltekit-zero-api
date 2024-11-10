import { functions } from "./functions.ts";
import { BadRequest, OK } from "./http.ts";
import { FakeKitEvent, KitEvent } from "./kitevent.ts";


Deno.test('functions', async () => {

	function someFn(event: KitEvent, input: { name: string, age: string }, n: number) {
		if(Math.random() > 0.5) {
			return new BadRequest({ code: 'invalid', error: 'You are quite the unlucky fellow.' })
		}

		return new OK('Success')
	}

	const PATCH = functions({
		someFn
	})

	let result = await PATCH.$.someFn(new FakeKitEvent(), { name: 'Shiba', age: '21' }, 42)
	console.log(result)
})
