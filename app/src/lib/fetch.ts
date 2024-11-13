
export const github = () => 
	fetch('https://api.github.com/repos/Refzlund/sveltekit-zero-api')
		.then((r) => r.json())

export const npmjs = () => 
	fetch('https://api.npmjs.org/downloads/point/last-month/sveltekit-zero-api')
		.then(r => r.json())