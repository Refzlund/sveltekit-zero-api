import { KitEvent } from './kitevent'


export class SSE<
	TEvent extends KitEvent = KitEvent,
	T extends { event: string, data: any } = any
> {
	fn: (event: TEvent) => Generator<T> | AsyncGenerator<T>
	constructor(fn: (event: TEvent) => Generator<T> | AsyncGenerator<T>) {
		this.fn = fn
	}

	static event<E extends string, T>(event: E, data: T) {
		return { event, data }
	}
}

