import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import ts from 'typescript-eslint'
import svelteConfig from './sveltekit-zero-api/svelte.config.js'
import stylistic from '@stylistic/eslint-plugin'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	globalIgnores([
		'**/eslint.config.js',
		'**/lokalnyt_app/**/*',
		'**/svelte.config.js',
		'**/.svelte-kit/*',
		'**/node_modules/*',
		'**/.wrangler/*',
		'**/.git/*',
		'**/.mongodb/*',
		'**/.cloudflare/*',
		'**/lang/src/paraglide/*',
		'**/src-tauri/target/*'
	]),
	{
		files: ['**/*.{js,mjs,cjs,ts,svelte}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node 
			},
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte',
					'.ts',
					'.js'],
				parser: ts.parser,
				svelteConfig
			}
		},
		plugins: { '@stylistic': stylistic },
		rules: {
			'no-undef': 'off',
			'no-empty-pattern': 'off',

			// Svelte Rules
			'svelte/html-quotes': ['error', { 'prefer': 'single' }],
			'svelte/max-attributes-per-line': ['error',
				{
					'multiline': 1,
					'singleline': 2
				}],
			'svelte/indent': ['error', { 'indent': 'tab' }],
			'svelte/shorthand-attribute': 'error',
			'svelte/shorthand-directive': 'error',
			'svelte/sort-attributes': 'error',
			'svelte/spaced-html-comment': 'error',
			'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
			'svelte/first-attribute-linebreak': [
				'error',
				{
					'multiline': 'below',
					'singleline': 'beside'
				}
			],
			'svelte/html-closing-bracket-new-line': [
				'error',
				{
					'singleline': 'never',
					'multiline': 'always',
					'selfClosingTag': {
						'singleline': 'never',
						'multiline': 'always'
					}
				}
			],
			'svelte/html-closing-bracket-spacing': [
				'error',
				{
					'startTag': 'never',
					'endTag': 'never',
					'selfClosingTag': 'always'
				}
			],

			// TypeScript Rules
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-empty-interface': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@stylistic/member-delimiter-style': ['error',
				{
					'multiline': {
						'delimiter': 'none',
						'requireLast': false
					},
					'singleline': {
						'delimiter': 'comma',
						'requireLast': false
					}
				}],
			'@stylistic/type-annotation-spacing': ['error',
				{
					'before': false,
					'after': true,
					'overrides': {
						'arrow': {
							'before': true,
							'after': true
						}
					}
				}],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					'selector': 'interface',
					'format': ['PascalCase'],
					'custom': {
						'regex': '^I[A-Z]',
						'match': false
					}
				}
			],

			// @stylistic - https://eslint.style/packages/default
			'@stylistic/quotes': ['error',
				'single',
				{ allowTemplateLiterals: 'always' }],
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/comma-dangle': ['error', 'never'],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/space-before-function-paren': ['error',
				{
					'anonymous': 'never',
					'named': 'never',
					'asyncArrow': 'always'
				}],
			'@stylistic/space-before-blocks': ['error', 'always'],
			'@stylistic/indent': [
				'error',
				'tab',
				{ 'ignoredNodes': ['ConditionalExpression'] }
			],
			'@stylistic/indent-binary-ops': ['error', 'tab'],
			'@stylistic/array-bracket-newline': ['error', 'consistent'],
			'@stylistic/array-element-newline': ['error',
				{
					multiline: true,
					minItems: 3 
				}],
			'@stylistic/space-infix-ops': ['error'],
			'@stylistic/comma-spacing': ['error',
				{
					'before': false,
					'after': true 
				}],
			'@stylistic/function-call-argument-newline': ['error', 'consistent'],
			'@stylistic/function-paren-newline': ['error', 'multiline'],
			'@stylistic/key-spacing': ['error',
				{
					'beforeColon': false,
					'afterColon': true,
					'mode': 'strict'
				}],
			'@stylistic/block-spacing': ['error', 'always'],
			'@stylistic/no-multi-spaces': ['error', { 'ignoreEOLComments': true }],
			'@stylistic/object-curly-newline': [
				'error',
				{ multiline: true }
			],
			'@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }]
		}
	}
)