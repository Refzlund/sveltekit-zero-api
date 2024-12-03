import { Created, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions, type KitEvent } from 'sveltekit-zero-api/server'
import { Article, articles } from '.'
import { zod } from '$lib/zod'


export const GET = endpoint(() => new OK(articles))

export const POST = endpoint(
	zod({ body: Article.omit({ id: true }) }),
	(event) => {
		let { title, content } = event.body
		
		articles.push({ id: 'User:' + articles.length, title, content })
		
		return new Created({ message: 'Article created.' })
	}
)

export const PATCH = functions({
	search: (event: KitEvent, name: string) => {
		return new OK(articles.filter((articles) => articles.title.includes(name)))
	}
})