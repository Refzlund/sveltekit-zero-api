import { BadRequest, KitResponse, OK } from '../server/http.ts'
import { FakeKitEvent } from '../server/kitevent.ts'
import { endpoint } from '../server/endpoint.ts'
import { EndpointProxy, ReturnedEndpointProxy } from '../endpoint-proxy.ts'
import { expect } from '@std/expect'

Deno.test('proxy exception catching ᵗʰᵉᵐ ᵃˡˡ', async () => {
	const GET = endpoint(() => new OK())

	let successCalls = 0
	const f1 = () =>
		GET(new FakeKitEvent(), {})
			.success(() => successCalls++)
			.$.OK((r) => {
				throw new Error('🦒')
			})
			.OK((r) => '🐕')

	const r1 = f1() // 1
	const r2 = f1() // 2
	const [r3, r4] = f1() // 3

	await expect(r1.catch((e) => e.message)).resolves.toBe('🦒')
	await expect(r2).resolves.rejects.toThrow()
	await expect(r3).resolves.rejects.toThrow()
	await expect(r4).resolves.toBe('🐕')
	expect(successCalls).toBe(3)
})

Deno.test('proxy indepedence ᵈᵃʸ', async () => {

	const GET = endpoint(
		() => Math.random() > 0.5 ? new OK() : new BadRequest()
	)
	const f = () => GET(new FakeKitEvent(), {})

	let rootRuns = 0
	const root = f().any(() => rootRuns++)
	const $root = root.$.any((r) => 'root' as const)

	let a = root.$.any(r => 'any' as const)
	let b = $root.OK(r => 'ok' as const).BadRequest(r => 'br' as const)

	let z = root.any(() => rootRuns++)

	let [a1] = a
	let [root1, b1, b2] = b

	await expect(root1).resolves.toBe('root')
	await expect(a1).resolves.toBe('any')
	expect(await b1 ?? 'ok').toBe('ok')
	expect(await b2 ?? 'br').toBe('br')
	await expect(z).resolves.toBeInstanceOf(KitResponse)

})

Deno.test('proxy instanceof', async () => {
	function functionParamProxy<T extends EndpointProxy>(e: T) {
		if (e instanceof EndpointProxy) return e
		throw new Error()
	}
	function functionParamReturnedProxy<T extends ReturnedEndpointProxy>(e: T) {
		if (e instanceof ReturnedEndpointProxy) return e
		throw new Error()
	}

	const GET = endpoint(() => new OK())

	const f = GET(new FakeKitEvent(), {})

	let ran = 0

	// Is an Endpoint Proxy
	functionParamProxy(f.OK(() => ran++))

	let r = functionParamReturnedProxy(f.$.OK(() => 'ok'))

	// @ts-expect-error Is not returned
	expect(() => functionParamReturnedProxy(f.success(() => ran++))).toThrow()

	// @ts-expect-error Is not a EndpointProxy
	expect(() => functionParamProxy({})).toThrow()

	await expect(r[0]).resolves.toBe('ok')
	expect(r[1]).toBeUndefined()

	await expect(f).resolves.toBeInstanceOf(KitResponse)
	expect(ran).toBe(2)
})