export class Paginator<T> {
	list: T[] = []
	current: number = 0
	total?: number = 0
	async next() {}
	async prev() {}
	constructor(count?: number) {}
}