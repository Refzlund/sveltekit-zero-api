When installing do

- Remove workspace dependency in `package.json`
- `deno install --allow-scripts` from root
- Re-add workspace dependency and do `bun install`

Then you can run the project from root using `deno task app`