import path from "node:path";
import less from "less";
import {
	type Visitor,
	browserslistToTargets,
	composeVisitors,
	transform,
} from "lightningcss";
import type {
	LessOptions,
	LightningCssOptions,
	UserConfig,
} from "../define-config.ts";
import { logger } from "../util/logger.ts";
import type { SourceMap, TransformResult } from "./index.ts";

interface TransformCSSOptions {
	filename: string;
	outFilePath: string;
	inputSourceMap?: string;
	sourcemap: boolean;
	targets: UserConfig["targets"];
	plugins?: Visitor<any>[];
	lightningcssOptions?: LightningCssOptions;
	cssModules?: string;
	minify: boolean;
}

//                    ->  browserslist     -> lightningcss
// {chrome: "x.y.z" } -> ["chrome x.y.z"]  -> { chrome: x << 16 | y << 8 | z }
function getLightningcssTarget(targets: UserConfig["targets"] = {}) {
	const browserslist = Object.keys(targets).map(
		browser => `${browser} ${targets[browser]}`,
	);
	return browserslistToTargets(browserslist);
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
		cssModules,
		minify,
	} = options;
	const plugins: Visitor<any>[] = [];
	const { code, map, warnings } = transform({
		code: Buffer.from(content),
		targets: getLightningcssTarget(targets),
		// 不支持 自定义 hash (如: [name]__[local]___[hash:base64:5])
		// 支持 :global(), :local(), 不支持 :global, :local
		cssModules: cssModules ? { pattern: cssModules } : false,
		visitor: composeVisitors(plugins),
		filename,
		inputSourceMap,
		sourceMap: sourcemap,
		minify,
		// include: Features.VendorPrefixes,
		// exclude: Features.VendorPrefixes,
		...lightningcssOptions,
	});

	if (warnings.length) {
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
	lessOptions?: LessOptions;
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
