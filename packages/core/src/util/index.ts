import fs from "fs/promises";

export const pathExists = (path: string): Promise<boolean> =>
	fs
		.access(path)
		.then(() => true)
		.catch(() => false);

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	fn: T,
	wait: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<T>) => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		return new Promise(resolve => {
			timer = setTimeout(() => {
				resolve(fn(...args));
			}, wait);
		});
	};
}
