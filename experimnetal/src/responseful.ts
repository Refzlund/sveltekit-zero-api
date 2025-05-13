/* eslint-disable no-unused-private-class-members */
/* eslint-disable @typescript-eslint/no-unused-expressions */

/// <reference path='./namespace.responseful.ts' />


// import { Requestful, Responseful } from '@responseful/request'
// import { s.Object({  }), validate, metadata } from '@responseful/schema'
// import { auth } from '@responseful/sveltekit'


/*

	const response = ...
	const data = response.json


*/

import type { MaybePromise, NonReadonly } from './types'
import type { StatusCode, StatusCodeType } from './types.response'

/**
 * It parses JSON (eliminating await json) when the response is a JSON object or array.
 * It polyfills async iterator for readables streams, and parses contents if it registers it as JSON.
*/


const example = new Response()


type Promised<T, TState extends 'fulfilled' | 'unfulfilled'> = TState extends 'fulfilled' ? T : Promise<T>
type PromiseResolve<TArg extends [unknown] = [result: unknown]> = {
	resolve: (...args: TArg) => void
	reject: (error: Error) => void 
}

function makePromise<T>(
	resolvers: (resolvers: PromiseResolve<[value: T]>) => void,
	setValue: (value: T) => void
) {
	return new Promise<T>((_resolve, reject) => {
		const resolve = (value: T) => {
			setValue(value)
			_resolve(value)
		}
		resolvers({
			resolve,
			reject 
		})
	})
}

type ResponsefulType<TBody = unknown, TStatus extends StatusCodeType | unknown = StatusCodeType> = {
	status: TStatus
	body: TBody
}
type ResponsefulStatus<Body, TStatus extends StatusCodeType, TState extends 'unfulfilled' | 'fulfilled'> = Responseful<{
	status: TStatus
	body: NonReadonly<Body>
}, TState> extends infer R ? R : never
	
type ResponseCallback<TResponseful extends Responseful<{
	status: StatusCodeType
	body: unknown 
}, 'fulfilled'>, TypedResponse extends ResponsefulType, TThis> = 
	TResponseful extends Responseful<{ status: infer S, body: unknown }, 'fulfilled'> 
		? TypedResponse['status'] extends S 
			? (
				(cb: (response: TResponseful) => unknown) => TThis
			) 
			: never
		: never

export class Responseful<TypedResponse extends ResponsefulType, TState extends 'unfulfilled' | 'fulfilled' = 'unfulfilled'> {

	#statusPromise?: PromiseResolve<[status: StatusCodeType]>
	#status: Promise<StatusCodeType> | TypedResponse['status'] = makePromise<StatusCodeType>(
		resolvers => this.#statusPromise = resolvers,
		value => this.#status = value as TypedResponse['status']
	)

	get status(): Promised<StatusCodeType, TState> {
		return this.#status as Promised<StatusCodeType, TState>
	}

	statusText: Promised<string, TState>
	ok: Promised<TypedResponse['status'] extends StatusCode['Success'] ? true : false, TState>
	redirected: Promised<boolean, TState>
	type: Promised<ResponseType, TState>
	url: Promised<string, TState>


	// * Body contents
	arrayBuffer: TypedResponse['body'] extends ArrayBuffer ? Promised<ArrayBuffer, TState> : never
	text: TypedResponse['body'] extends string ? Promised<string, TState> : never
	json: TypedResponse['body'] extends Blob | string | ArrayBuffer ? never : Promised<TypedResponse['body'], TState>
	blob: TypedResponse['body'] extends Blob ? Promised<Blob, TState> : never

	stream: { [Symbol.asyncIterator]: () => AsyncGenerator<TypedResponse['body']> }
	#then: TypedResponse['status'] extends number ? never : <T extends Responseful<{
		body: TypedResponse['body']
		status: StatusCodeType 
	}>>(
		onfulfilled: ((value: T) => T | PromiseLike<T>) | null | undefined,
		onrejected?: ((reason: Error) => Error | PromiseLike<Error>) | null | undefined
	) => this

	get then() {
		return this.#then
	}

	static via<TGen, TResult>(gen: Generator<TGen, TResult> | AsyncGenerator<TGen, TResult>)
	// typeof gen 
	{
		if(Symbol.asyncIterator in gen) {
			const async = gen
			return new Promise(resolve => {
				function awaited(result: IteratorResult<TGen>) {
					if(result.done || result.value instanceof Responseful) {
						resolve(result.value)
						return
					}
					async.next().then(awaited)
				}
				async.next().then(awaited)
			})
		}

		let last = undefined as undefined | TGen
		for(last of gen) {
			if(last instanceof Responseful) {
				return last
			}
		}
	}

	declare static OK: new <const T>(body: T) => Responseful.OK<NonReadonly<T>>
	declare static BadRequest: new <const T>(body: T) => Responseful.BadRequest<NonReadonly<T>>

	// declare Continue: ResponseCallback<100, TypedResponse, this>



	declare OK: TypedResponse['status'] extends 200 ? (
		(cb: (response: Responseful.OK<TypedResponse['body']>) => unknown) => this
	) : (cb: (response: never) => unknown) => this
	declare BadRequest: TypedResponse['status'] extends 400 ? (
		(cb: (response: Responseful.BadRequest<TypedResponse['body']>) => void) => this
	) : (cb: (response: never) => unknown) => this
	declare InternalServerError: TypedResponse['status'] extends 500 ? (
		(cb: (response: Responseful.BadRequest<TypedResponse['body']>) => void) => this
	) : (cb: (response: never) => unknown) => this

}



function test() {
	const random = Math.random()
	if(random < 0.5) {
		return new Responseful.OK({ message: 'example' })
	// } else if(random < 0.8) {
	// 	return new Responseful.BadRequest({
	// 		code: 'secondary_error',
	// 		message: 'For testing unions' 
	// 	})
	} else if(random < 0.1) {
		return new Responseful.BadRequest({
			code: 'example_error',
			message: 'Example' 
		})
	}
}


type Tester = Generator<number, void>

function* tester() {
	yield 1
	yield 2
}

function* POST() {
	// yield validate(event, postSchema)
	/*
		Responseful.BadRequest<{
			message: 'Body/query failed to validate',
			code: 'failed_endpoint_schema_validation',
			details: {...},
			schema: {...},
			_Schema: T, <-- Use this Schema for body/query type
		}>
	*/
	yield test()
	yield* tester()
}

const res = Responseful.via(POST())


const response = test()!
response.OK(res => {
	res.ok
}).BadRequest(res => {
	res.ok
})

const arr = response.OK(res => {
	return res.ok as true
})

response.BadRequest(res => {
	//
}).InternalServerError(res => {
	
})

if(response instanceof Responseful.OK) {
	response
}

const status = await response.status

for await (const chunk of response.stream) {
	//
}

