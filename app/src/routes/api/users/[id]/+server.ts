import { randomUUID } from 'node:crypto';
import { Created, NotFound, OK } from 'sveltekit-zero-api/http'
import { endpoint, parseJSON } from 'sveltekit-zero-api/server'
import { users, type User } from '..'



export const GET = endpoint(
	(event) => new OK(users.find(user => user.id === event.params.id))
)

export const PUT = endpoint(
	parseJSON<Omit<User, 'id'>>,
	(event) => {
		let user = users.find(user => user.id === event.params.id)
		if(!user) {
			return new NotFound({ 
				code: 'no_user',
				error: 'User not found.'
			})
		}

		let { name, email, age } = event.body
		
		if(name) user.name = name
		if(email) user.email = email
		if(age) user.age = age
		
		return new OK({ message: 'User updated.' })
	}
)