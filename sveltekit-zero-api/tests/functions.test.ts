import { expect } from '@std/expect';
import type { Simplify } from '../src/utils/types.ts'
import { functions } from '../src/server/functions.ts'
import { Generic } from "../src/server/generic.ts";
import { BadRequest, OK } from '../src/server/http.ts'
import { FakeKitEvent, type KitEvent } from '../src/server/kitevent.ts'

Deno.test('functions: readable stream', async () => {

	function fn() {

		let i = 10
		const stream = new ReadableStream<{ data: number }>({
			async pull(controller) {
				if (i == 0) return controller.close()
				await new Promise((resolve) => {
					setTimeout(() => resolve(controller.enqueue({ data: i-- })), 10)
				})
			}
		})

		return new OK(stream)
	}

	const PATCH = functions({
		fn
	})

	let fns = PATCH(new FakeKitEvent()).use

	let i = ''
	for await (const chunk of await fns.fn()) {
		i += `${chunk.data}`
	}

	expect(i).toBe('10987654321')
})

Deno.test('functions', async () => {
	interface Input {
		name: string
		age: number
	}

	function someFn<T extends Simplify<Input>>(event: KitEvent, input: T) {
		if (input.age > 61) {
			return new OK(null)
		}

		if (input.age < 24) {
			return new BadRequest(null)
		}

		return new OK({
			providedData: input
		})
	}

	const PATCH = functions({
		someFn,
		specificFn: (event) => new Generic(<const T extends Input>(input: T) => Generic.fn(someFn(event, input)))
	})

	let fns = PATCH(new FakeKitEvent()).use

	let result = fns.someFn({ name: 'Shiba', age: 23 })
	await expect(result).rejects.toThrow() // Throws a response when not success

	let result2 = fns.specificFn({ name: 'Bob', age: 69.69 })
	await expect(result2).resolves.toBe(null)

	let result3 = fns.specificFn({ name: 'Giraffe', age: 26 })
	await expect(result3).resolves.toEqual({ providedData: { name: 'Giraffe', age: 26 } })
})
