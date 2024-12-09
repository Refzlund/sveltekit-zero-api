import { insertSorted } from '../../utils/sort-merge'
import { RuneAPIInstance } from './instance.svelte'
import { Grouping, RunesDataInstance } from './instance.type'

export function createGroupsProxy(instance: RuneAPIInstance, groups: RunesDataInstance<unknown>['groups']) {
	const group: Record<string, unknown[]> = {}
	return new Proxy(groups!, {
		get(target, property) {
			if (typeof property === 'string' && property in instance.groups!) {
				const g = group[property]
				if (g) {
					return g
				}

				// * Initiate the group maintainence logic

				const groupArray = $state([]) as unknown[]
				group[property] = groupArray

				let filters = [] as Parameters<Grouping<unknown>['filter']>[0][]
				let sort: Parameters<Grouping<unknown>['sort']>[0] | undefined

				const proxy = {
					filter: (fn) => {
						filters.push(fn)
						return proxy
					},
					sort: (fn) => {
						sort = fn
						return proxy
					}
				} as Grouping<unknown>
				target[property](proxy)

				Array.from(instance.map.values()).forEach((value, index) => {
					if (filters.every((fn) => fn(value, index, groupArray))) {
						groupArray.push(value)
					}
				})
				if (sort) groupArray.sort(sort)

				instance.on('set', (_, value) => {
					if (filters.every((fn) => fn(value, groupArray.length, groupArray))) {
						if (sort) {
							insertSorted(groupArray, value, sort)
						} else {
							groupArray.push(value)
						}
					}
				})
				instance.on('remove', (key) => {
					const index = groupArray.findIndex(v => instance.discriminator.get(v) === key)
					if (index !== -1) {
						groupArray.splice(index, 1)
					}
				})

				return groupArray
			}
		}
	})
}