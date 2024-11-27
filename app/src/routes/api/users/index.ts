import { faker } from '@faker-js/faker'
import z from 'zod'

export const User = z.object({
	id: z.string(),
	name: z.string().min(3),
	email: z.string().email(),
	age: z.number().min(18),
	birth: z.string().datetime('yyyy-MM-dd'),
})

export const users: z.output<typeof User>[] = Array(100).fill(null).map((_, i) => {
	let birth = faker.date.birthdate()
	return {
		id: 'User:' + i,
		name: faker.person.fullName(),
		email: faker.internet.email(),
		birth: `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, '0')}-${String(birth.getDate()).padStart(2, '0')}`,
		age: new Date().getFullYear() - birth.getFullYear(),
	}
})