import * as fs from 'node:fs'
import process from 'node:process'

const cwd = process.cwd().replaceAll('\\', '/') // for TS imports

export function getEndpointFiles(path: string, file: string, array: string[] = []) {
	function getEndpointFiles(path: string, file: string, array: string[] = []) {
		const full = path + '/' + file

		const stats = fs.statSync(full)

		if (stats.isDirectory()) {
			const files = fs.readdirSync(full)
			for (const subfile of files) {
				getEndpointFiles(full, subfile, array)
			}
		} else {
			if (!file.startsWith('+server')) return array
			array.push(full.replaceAll(cwd, ''))
		}
		return array
	}

	return getEndpointFiles(path, file, array)
}
