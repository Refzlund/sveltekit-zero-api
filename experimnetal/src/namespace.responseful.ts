/* eslint-disable @typescript-eslint/no-namespace */

/// <reference path='./types.ts' />
/// <reference path='./responseful.ts' />
/// <reference path='./requestful.ts' />



// @ts-expect-error "Not allowed"
namespace Responseful {


	export declare class OK<TBody> extends (await import('./responseful')).Responseful<{
		status: 200
		body: TBody
	}, 'fulfilled'> {}
	export declare class BadRequest<TBody> extends (await import('./responseful')).Responseful<{
		status: 400
		body: TBody
	}, 'fulfilled'> {}


}
