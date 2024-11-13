import { build, emptyDir } from 'jsr:@deno/dnt'

await emptyDir('./npm')

await build({
	entryPoints: ['./src/index.ts'],
	outDir: './npm',

	shims: {
		// see JS docs for overview and more options
		deno: true
	},
	package: {
		// package.json properties
		name: 'sveltekit-zero-api',
		version: Deno.args[0],
		description: 'Your package.',
		license: 'MIT',
		repository: {
			type: 'git',
			url: 'git+https://github.com/username/repo.git'
		},
		bugs: {
			url: 'https://github.com/username/repo/issues'
		},
		peerDependencies: {
			svelte: '^5.1.12',
			'@sveltejs/kit': '^2.8.0'
		}
	},
	postBuild() {
		// steps to run after building and before running the tests
		Deno.copyFileSync('LICENSE', 'npm/LICENSE')
		Deno.copyFileSync('README.md', 'npm/README.md')
	}
})
