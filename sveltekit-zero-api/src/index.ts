import isOdd from 'npm:is-odd@latest'
import 'npm:@types/is-odd@latest'

export const consolelogOddness = (number: number) => {
	console.log(`The number ${number} is indeed ${isOdd(number) ? 'odd' : 'even'}`)
}
