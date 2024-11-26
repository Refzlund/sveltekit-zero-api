import { randomUUID } from 'node:crypto';
import { Created, OK } from 'sveltekit-zero-api/http'
import { endpoint, parseJSON } from 'sveltekit-zero-api/server'
import { users, type User } from '.'



export const GET = endpoint(
	() => new OK(users)
)

export const POST = endpoint(
	parseJSON<Omit<User, 'id'>>,
	(event) => {
		let { name, email, age, birth } = event.body
		
		users.push({ id: 'User:' + users.length, name, email, age, birth })
		
		return new Created({ message: 'User created.' })
	}
)