export function stream<T>(fn: () => Generator<T> | AsyncGenerator<T>) {
	return new ReadableStream<T>({
		async pull(controller) {
			await new Promise((resolve) => setTimeout(resolve, 0))
			for await (const chunk of fn()) {
				let data = typeof chunk === 'string' ? chunk : JSON.stringify(chunk)
				controller.enqueue(data as any)
			}
			controller.close()
		},
	})
}