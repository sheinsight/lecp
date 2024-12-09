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

// react-dom -> ReactDom
// @scope/react-dom -> ScopeReactDom
// lodash.get -> LodashGet
// npm package.name 规范: /^(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*$/
// 只考虑常规的情况
export const toUmdName = (s: string): string => {
	if (!s) return "";
	const text = s
		.replace(/[@/~.-]/g, "_")
		.replace(/(_[a-z0-9])/gi, $1 => $1.toUpperCase().replace("_", ""));
	return text[0].toUpperCase() + text.slice(1);
};

export const merge = <T extends object>(...args: Partial<T>[]): T => {
	// return deepmerge.all<T>(args);
	return args.reduce((prev, next) => Object.assign(prev, next), {}) as T;
};
