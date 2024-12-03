# SvelteKit-zero-API 2.0.0

A complete rewrite of SvelteKit-zero-API

- All existing V1 features
  - Typed endpoints
  - Generic endpoints
  - Slugs
  - QuerySpread
  - Endpoint "pipe"

- Upgrades to V1 features
  - QuerySpread now accessed immediately via `event.query`
  - The term "endpoint pipe functions" should be considered "endpoint middlewares", as that's what they are. Massive iomprovement upon this concept.
  - Improvements to how to create generic endpoints
  - The client API call chains are now independent from one another, can throw errors inside them independently, and .$. returns an array of promises.
  - Better classes to see if a function is a proxy of sveltekit-zero-api (ex. `req instanceof KitRequest`)
  - Complex slugs are now supported
  - Endpoints with bring-your-own validation
  - Responses being instanceof `Error` to allow `throw new OK(...)` in Vite and outside of Vite

- New functionality
  - A `hooks.server.ts` zero-api options: Ex. run a function (like waiting for db connection) before reaching endpoints
  - Support XHR, SSE (Server-side events), ReadableStream, FormData, streamed data
  - Use backend validation for frontend validation
  - Endpoint functions: Call endpoints like they're a function
  - FormAPI: Manage forms using runes and sveltekit-zero-api API
  - StatefulAPI: An async task process that runs an API based off a cooldown or a warmup
  - RunesAPI: A client data management layer using Runes.
  - `npx sveltekit-zero-api`: Include it into your project effortless
  - Testing: You can leverage `new FakeKitEvent()` to create a KitEvent, for testing endpoints.
  - Call endpoints on server/in tests; you can do `let [promise] = GET(event).use(body, { query: {...} }).OK(...).$.success(...)` on the server/in tests.

It's a massive update. I'll include a website for documentation, for a more pleasing dev experience in this update.

When ready, I'll make a video or two show-casing both old and new.