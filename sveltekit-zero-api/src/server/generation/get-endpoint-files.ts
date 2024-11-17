import * as fs from 'node:fs'

export function getEndpointFiles(path: string, file: string, array: string[] = []) {
	let initial = path
	
	function getEndpointFiles(path: string, file: string, array: string[] = []) {
		const full = path + '/' + file

		let stats = fs.statSync(full)

		if (stats.isDirectory()) {
			let files = fs.readdirSync(full)
			for (let subfile of files) {
				getEndpointFiles(full, subfile, array)
			}
		} else {
			if (!file.startsWith('+server')) return array
			array.push(full.replaceAll(initial, ''))
		}
		return array
	}

	return getEndpointFiles(path, file, array)
}
