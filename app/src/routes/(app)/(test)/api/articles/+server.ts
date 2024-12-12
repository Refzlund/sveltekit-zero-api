import { Created, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions, type KitEvent } from 'sveltekit-zero-api/server'
import { Article, articles } from '.'
import { zod } from '$lib/zod'


export const GET = endpoint(() => new OK(articles))

export const POST = endpoint(
	zod({ body: Article.omit({ id: true }) }),
	(event) => {
		let { title, content } = event.body
		
		articles.push({ id: `Article:${articles.length}`, title, content })
		
		return new Created(articles[articles.length - 1])
	}
)

export const PATCH = functions({
	paginate(_, index: number) {
		return new OK(
			articles.slice(index, index + 12)
		)
	},
	total() {
		return new OK(Math.ceil(articles.length / 12))
	}
})