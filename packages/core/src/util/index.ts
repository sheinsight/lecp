import { createRequire } from "module";
import fs from "fs/promises";
import type { FormatType } from "../define-config.ts";

export const measure = async <T>(
	fn: () => Promise<T>,
): Promise<{
	result: Awaited<T>;
	duration: string;
}> => {
	const start = performance.now();
	const result = await fn();
	return { result, duration: (performance.now() - start).toFixed(0) };
};

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

export const isLess: RegExp = /\.less$/;
export const isCss: RegExp = /\.css$/;
export const isScript: RegExp = /\.(c|m)?(t|j)sx?$/;
export const isDts: RegExp = /\.d\.(c|m)?tsx?$/;
export const isJsx: RegExp = /\.(t|j)sx$/;

/**
 * |     | module | commonjs |
 * | --- | ------ | -------- |
 * | esm | .js     | .mjs    |
 * | cjs | .cjs    | .js     |
 *
 * @description
 * - target: browser 不处理后缀
 * - target: node 处理后缀
 */
export function getOutJsExt(
	isNode: boolean,
	isModule: boolean,
	format: FormatType,
): string {
	if (!isNode) return "js";

	if (isModule && format === "cjs") return "cjs";
	if (!isModule && format === "esm") return "mjs";

	return "js";
}

export function getBrowsersList({
	targets,
}: { targets: Record<string, any> }): string[] {
	return Object.keys(targets).map(key => {
		return `${key} >= ${targets[key] === true ? "0" : targets[key]}`;
	});
}

export const requireResolve = (id: string): string => {
	try {
		return require.resolve(id);
	} catch {
		return createRequire(import.meta.url).resolve(id);
	}
};
