import { RuneAPI as RuneAPI_ } from './runeapi.type'

export class RuneAPI {
	constructor() {
		throw new Error('Cannot construct RuneAPI. Please use `runesAPI` method to instantiate.')
	}
}
export interface RuneAPI extends RuneAPI_<unknown, unknown, unknown> {}