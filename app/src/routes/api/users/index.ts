import { faker } from '@faker-js/faker'

export interface User {
	id: string
	name: string
	email: string
	age: number
	birth: Date | string
}

export const users: User[] = Array(100).fill(null).map((_, i) => {
	let birth = faker.date.birthdate()
	return {
		id: 'User:' + i,
		name: faker.person.fullName(),
		email: faker.internet.email(),
		birth: `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, '0')}-${String(birth.getDate()).padStart(2, '0')}`,
		age: new Date().getFullYear() - birth.getFullYear(),
	}
})