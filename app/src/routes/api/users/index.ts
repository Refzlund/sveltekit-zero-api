import { faker } from '@faker-js/faker'

export interface User {
	id: string
	name: string
	email: string
	age: number
}

export const users: User[] = Array(100).fill(null).map((_, i) => ({
	id: 'User:' + i,
	name: faker.person.fullName(),
	email: faker.internet.email(),
	age: Math.floor(Math.random() * 50) + 18
}))