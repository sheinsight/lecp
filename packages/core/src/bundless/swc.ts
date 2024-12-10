import type { Options as SwcOptions } from "@swc/core";
import deepmerge from "deepmerge";
import type { SystemConfig } from "../build.ts";
import type { UserConfig } from "../define-config.ts";

// '@': './src' -> '@/*': ['./src/*'],
// TODO: 兼容性 config 统一format
// '@': 'src' -> '@/*': ['./src/*'],
// '@': './src/' -> '@/*': ['./src/*'],
// 绝对路径处理 ??
const aliasToTsPath = (alias: Record<string, string> = {}) => {
	return Object.entries(alias).reduce(
		(acc, [name, value]) => {
			acc[`${name}/*`] = [`${value}/*`];
			return acc;
		},
		{} as Record<string, [string]>,
	);
};

/** 编译类型 */
export type FormatType = "esm" | "cjs" | "umd";

interface GetOptions {
	type: FormatType;
	swcOptions?: SwcOptions;
	targets: UserConfig["targets"];
	sourcemap: UserConfig["sourcemap"];
	externalHelpers?: UserConfig["externalHelpers"];
	react?: UserConfig["react"];
	css?: UserConfig["css"];
	alias: UserConfig["alias"];
	define: UserConfig["define"];
}

const swcModuleMap = { esm: "es6", cjs: "commonjs", umd: "umd" } as const;

/**
 *
 * @param isModule isModule: package.json type: "module"
 */
const getOutFileExtension = (format: FormatType, isModule: boolean) => {
	let outFileExtension = "js";
	if (isModule && format === "cjs") outFileExtension = "cjs";
	if (!isModule && format === "esm") outFileExtension = "mjs";
	return outFileExtension;
};

export const getSwcOptions = (
	options: GetOptions,
	config: SystemConfig,
): SwcOptions => {
	const { cwd, pkg } = config;
	const {
		type: format,
		swcOptions,
		targets,
		sourcemap,
		externalHelpers,
		alias,
		define,
		react,
		css,
	} = options;

	// TODO: wasm 插件
	const plugins: Array<[string, Record<string, any>]> = [];
	// if (define) plugins.push(["transform-define", define]);
	// if (css?.cssModules)
	// 	plugins.push([
	// 		"transform-css-modules",
	// 		{ generate_scoped_name: css.cssModules },
	// 	]);
	// if (css?.lessCompile) plugins.push(["transform-less2css", {}]);
	// if (format !== "umd") plugins.push(["transform-ts2js", {}]);

	const defaultSwcOptions: SwcOptions = {
		env: {
			mode: "entry",
			coreJs: "3",
		},
		// https://github.com/swc-project/swc/issues/4589
		// swc isModule: true, defined multiple times will error
		// isModule: format !== "umd",
		jsc: {
			// https://swc.rs/docs/configuration/compilation#jscexternalhelpers
			externalHelpers, // @swc/helpers
			// target: "es5", // `env` and `jsc.target` cannot be used together
			parser: {
				syntax: "typescript", //  isTs ? 'typescript' : 'ecmascript',
				tsx: true,
				decorators: true,
			},
			transform: {
				legacyDecorator: true,
				decoratorMetadata: true,
				react: {
					runtime: react?.jsxRuntime,
				},
			},
			baseUrl: cwd,
			// https://github.com/swc-project/swc/issues/3614 暂不支持替换 require 和 require.resolve
			paths: aliasToTsPath(alias),

			experimental: {
				plugins,
				cacheRoot: "node_modules/.cache/swc",
			},
		},
	};

	return deepmerge.all<SwcOptions>([
		defaultSwcOptions,
		swcOptions || {},
		{
			swcrc: false,
			configFile: false,
			module: {
				type: swcModuleMap[format],
				resolveFully: true,
				outFileExtension: getOutFileExtension(format, pkg.type === "module"), // 1.10.1 支持. 不生效 ??
			},
			env: { targets },
			sourceMaps: sourcemap,
		} as SwcOptions,
	]);
};
