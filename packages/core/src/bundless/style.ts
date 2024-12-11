import path from "node:path";
import less from "less";
import {
	type TransformOptions,
	type Visitor,
	composeVisitors,
	transform,
} from "lightningcss";
import { logger } from "../util/logger.ts";
import type { SourceMap, TransformResult } from "./index.ts";

interface TransformCSSOptions {
	filename: string;
	outFilePath: string;
	inputSourceMap?: string;
	sourcemap: boolean;
	targets: TransformOptions<any>["targets"];
	plugins?: Visitor<any>[];
	lightningcssOptions?: Omit<TransformOptions<any>, "code" | "filename">;
}

export async function transformCSS(
	content: string,
	options: TransformCSSOptions,
): Promise<TransformResult> {
	const {
		filename,
		inputSourceMap,
		sourcemap,
		targets,
		lightningcssOptions,
		outFilePath,
	} = options;
	const plugins: Visitor<any>[] = [];
	const { code, map, warnings } = transform({
		code: Buffer.from(content),
		targets,
		cssModules: {
			// 不支持 自定义 hash ([name]__[local]___[hash:base64:5])
			// 不支持 :global, :local
			pattern: "[name]__[local]___[hash]",
		},
		visitor: composeVisitors(plugins),
		filename,
		inputSourceMap,
		sourceMap: sourcemap,
		...lightningcssOptions,
	});
	if (warnings) {
		// TODO: 优化
		logger.warn(warnings);
	}

	return {
		code: new TextDecoder().decode(code),
		map: map
			? relativeSourcemap(new TextDecoder().decode(map), outFilePath)
			: undefined,
	};
}

export function relativeSourcemap(rawMap: string, outFilePath: string): string {
	const map: SourceMap =
		typeof rawMap === "string" ? JSON.parse(rawMap) : rawMap;

	// 绝对路径 -> 相对路径
	if (map?.sources) {
		map.sources = map.sources.map(filePath =>
			path.relative(
				path.dirname(outFilePath),
				filePath.startsWith("/") ? filePath : `/${filePath}`, // lightningcss sources 开头无 /
			),
		);
	}

	return JSON.stringify(map);
}

export interface TransformLessOptions {
	filename: string;
	lessOptions?: Less.Options;
	sourcemap: boolean;
}

export async function transformLess(
	content: string,
	{ lessOptions, sourcemap, filename }: TransformLessOptions,
): Promise<TransformResult> {
	const { css, map } = await less.render(content, {
		...lessOptions,
		...(sourcemap && { sourceMap: { outputSourceFiles: true } }),
		filename,
	});

	return {
		code: css,
		map,
	};
}
