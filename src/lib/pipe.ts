import type { KitEvent, KitResponse } from './index.js'
import { InternalServerError } from './http.js'

type Fn<KitEv extends KitEvent, TLocals, R, TReturn extends KitResponse | void> =
	(event: { locals: Simplify<TLocals> } & KitEv, n: R) => TReturn | void

/**
 * @example
 * export async function POST<const Request extends Post>(event: KitEvent<Request>) {
 * 	return endpoint(event)(
 * 		authGuard('admin'),
 * 		validateBody(UserSchema),
 * 		(event) => {
 * 			// ... Do stuff
 * 			return Ok({
 * 				body: {
 * 					...
 * 				}
 * 			})
 * 		}
 * 	)
 * }
*/
export function endpointPipe<
	KitEv extends KitEvent,
	TFallback extends () => KitResponse = never
>(
	event: KitEv,
	fallbackResponse?: TFallback
) {
	return async function endpointPipeline<
		E0 extends KitEvent,
		E1 extends KitEvent,
		E2 extends KitEvent,
		E3 extends KitEvent,
		E4 extends KitEvent,
		E5 extends KitEvent,
		E6 extends KitEvent,
		E7 extends KitEvent,
		E8 extends KitEvent,
		E9 extends KitEvent,
		E10 extends KitEvent,
		E11 extends KitEvent,
		E12 extends KitEvent,
		E13 extends KitEvent,
		E14 extends KitEvent,
		E15 extends KitEvent,
		E16 extends KitEvent,
		E17 extends KitEvent,
		E18 extends KitEvent,
		E19 extends KitEvent,
		R0 extends KitResponse | void = void,
		R1 extends KitResponse | void = void,
		R2 extends KitResponse | void = void,
		R3 extends KitResponse | void = void,
		R4 extends KitResponse | void = void,
		R5 extends KitResponse | void = void,
		R6 extends KitResponse | void = void,
		R7 extends KitResponse | void = void,
		R8 extends KitResponse | void = void,
		R9 extends KitResponse | void = void,
		R10 extends KitResponse | void = void,
		R11 extends KitResponse | void = void,
		R12 extends KitResponse | void = void,
		R13 extends KitResponse | void = void,
		R14 extends KitResponse | void = void,
		R15 extends KitResponse | void = void,
		R16 extends KitResponse | void = void,
		R17 extends KitResponse | void = void,
		R18 extends KitResponse | void = void,
		R19 extends KitResponse | void = void,
		L0 = {},
		L1 = {},
		L2 = {},
		L3 = {},
		L4 = {},
		L5 = {},
		L6 = {},
		L7 = {},
		L8 = {},
		L9 = {},
		L10 = {},
		L11 = {},
		L12 = {},
		L13 = {},
		L14 = {},
		L15 = {},
		L16 = {},
		L17 = {},
		L18 = {},
		L19 = {}
	>(
		fn1:   Fn<E0, {}, L0, R0>,
		fn2?:  Fn<E1, L0, L1, R1>,
		fn3?:  Fn<E2, L0 & L1, L2, R2>,
		fn4?:  Fn<E3, L0 & L1 & L2, L3, R3>,
		fn5?:  Fn<E4, L0 & L1 & L2 & L3, L4, R4>,
		fn6?:  Fn<E5, L0 & L1 & L2 & L3 & L4, L5, R5>,
		fn7?:  Fn<E6, L0 & L1 & L2 & L3 & L4 & L5, L6, R6>,
		fn8?:  Fn<E7, L0 & L1 & L2 & L3 & L4 & L5 & L6, L7, R7>,
		fn9?:  Fn<E8, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7, L8, R8>,
		fn10?: Fn<E9, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8, L9, R9>,
		fn11?: Fn<E10, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9, L10, R10>,
		fn12?: Fn<E11, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10, L11, R11>,
		fn13?: Fn<E12, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11, L12, R12>,
		fn14?: Fn<E13, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12, L13, R13>,
		fn15?: Fn<E14, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13, L14, R14>,
		fn16?: Fn<E15, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13 & L14, L15, R15>,
		fn17?: Fn<E16, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13 & L14 & L15, L16, R16>,
		fn18?: Fn<E17, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13 & L14 & L15 & L16, L17, R17>,
		fn19?: Fn<E18, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13 & L14 & L15 & L16 & L17, L18, R18>,
		fn20?: Fn<E19, L0 & L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11 & L12 & L13 & L14 & L15 & L16 & L17 & L18, L19, R19>,
	): Promise<NonNullable<
		R0 | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 | R12 | R13 | R14 | R15 | R16 | R17 | R18 | R19
		| (TFallback extends never ? ReturnType<typeof InternalServerError> : ReturnType<TFallback>)
	>> {
		const n = null as any
		let r
		const ev = event as any
		const locals = event.locals as any
		
		if (fn1 && (r = await fn1(ev, locals))) return r
		if (fn2 && (r = await fn2(ev, locals))) return r
		if (fn3 && (r = await fn3(ev, locals))) return r
		if (fn4 && (r = await fn4(ev, locals))) return r
		if (fn5 && (r = await fn5(ev, locals))) return r
		if (fn6 && (r = await fn6(ev, locals))) return r
		if (fn7 && (r = await fn7(ev, locals))) return r
		if (fn8 && (r = await fn8(ev, locals))) return r
		if (fn9 && (r = await fn9(ev, locals))) return r
		if (fn10 && (r = await fn10(ev, locals))) return r
		if (fn11 && (r = await fn11(ev, locals))) return r
		if (fn12 && (r = await fn12(ev, locals))) return r
		if (fn13 && (r = await fn13(ev, locals))) return r
		if (fn14 && (r = await fn14(ev, locals))) return r
		if (fn15 && (r = await fn15(ev, locals))) return r
		if (fn16 && (r = await fn16(ev, locals))) return r
		if (fn17 && (r = await fn17(ev, locals))) return r
		if (fn18 && (r = await fn18(ev, locals))) return r
		if (fn19 && (r = await fn19(ev, locals))) return r
		if (fn20 && (r = await fn20(ev, locals))) return r

		return fallbackResponse ? fallbackResponse() : InternalServerError()
	}
}