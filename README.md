<br>

> [!IMPORTANT]  
> It is with happy consideration, that sveltekit-zero-api is being **deprecated** in favor of SvelteKits
> [Remote Functions](https://github.com/sveltejs/kit/discussions/13897) which includes both networking improvements,
> taking advantage of SvelteKit's other features such as [Transport Hooks](https://svelte.dev/docs/kit/hooks#Universal-hooks-transport)
> and general best practices when writing clean code.  This library is no longer in active development, and stands proud as an artifact from the past.
> 
> Happy coding and may the <img height="24" align="center" src="https://raw.githubusercontent.com/sveltejs/branding/c4dfca6743572087a6aef0e109ffe3d95596e86a/svelte-logo.svg"> Svelte be with you!

<br><br>

----

<br><br>

<p align="center">
    <img width="542" src="https://raw.githubusercontent.com/Refzlund/sveltekit-zero-api/master/SvelteKit%20Zero%20API.png" alt="SurrealDB Icon">
</p>
<h3 align="center">Seamless type-safety   means   better developer experience.</h3>

<p align="center">
	<img src="https://badge.fury.io/js/sveltekit-zero-api.svg">
	 
	<img src="https://img.shields.io/npm/dt/sveltekit-zero-api.svg">
</p>

<br><br>

## Quick Start

<p align="center">
	<code>npm i -D sveltekit-zero-api</code>
	 / 
	<code>pnpm add -D sveltekit-zero-api</code>
</p>

```ts
// vite.config.ts
import { zeroAPI } from 'sveltekit-zero-api'

const config: UserConfig = {
	plugins: [
		sveltekit(),
		zeroAPI()
	]
}

// .gitignore
**/sveltekit-zero-api.d.ts
```

<br>
<h2><img height="24" src="https://raw.githubusercontent.com/sveltejs/branding/c4dfca6743572087a6aef0e109ffe3d95596e86a/svelte-logo.svg">  What is SvelteKit Zero API?</h2>
<p>
<b>Zero API</b> attempts to sow the gap between the frontend and backend. This includes typing backend response codes and their content and dealing with them effectively using <a href="https://github.com/Refzlund/sveltekit-zero-api/wiki/2.-Frontend#callbacks">callback functions</a>. This may also include error handling. 
</p>

- Body and query is typed seemlessly in both frontend, and endpoints
- Queries are easier to use with querySpread which supports objects as query parameters
- Endpoint routes are automatically typed
- [Generic endpoints](https://github.com/Refzlund/sveltekit-zero-api/wiki/1.-Backend#generic-endpoints)
- [Typed endpoint pipeline](https://github.com/Refzlund/sveltekit-zero-api/wiki/3.-Endpoint-Pipe-function)
- The returned content of endpoints are typed
- Supports slugged routes
- Can be used in the page `Load` function
- You can type-define variables with endpoint responses
- Has handy backend utility functions; [querySpread](https://github.com/Refzlund/sveltekit-zero-api/wiki/1.-Backend#queryspread) and [Error Handling](https://github.com/Refzlund/sveltekit-zero-api/wiki/1.-Backend#error-handling)

![Assigning variables directly](https://github.com/Refzlund/sveltekit-zero-api/blob/master/assign-var.gif)
![Intellisense with API calls](https://github.com/Refzlund/sveltekit-zero-api/blob/master/frontend-intellisense.gif)

---

<p align="center">
Installation, usage and utility types can all be fond on the GitHub Wiki
</p>

<h3 align="center">
	<a href="https://github.com/Refzlund/sveltekit-zero-api/wiki/0.-Get-Started">Getting Started</a>
</h3>
<h3 align="center">
	<a href="https://github.com/Refzlund/sveltekit-zero-api/wiki/1.-Backend">Backend - Setting up endpoints</a>
</h3>
<h3 align="center">
	<a href="https://github.com/Refzlund/sveltekit-zero-api/wiki/2.-Frontend">Frontend - Using the API</a>
</h3>

<br>
<br>

## Acknowledgments

Thank you [ymzuiku](https://github.com/ymzuiku) for igniting the initial concept and codebase [svelte-zero-api](https://github.com/ymzuiku/svelte-zero-api). And naturally, a big thanks to the Vite and Svelte family for the worlds best framework!💘

<br>
<br>
