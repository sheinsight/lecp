import type { GlobalPassOption, Options as SwcOptions } from "@swc/core";
import deepmerge from "deepmerge";
import type { SystemConfig } from "../build.ts";
import type { FormatType, UserConfig } from "../define-config.ts";

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
 * webpack define 格式转换成 swc `jsc.transform.optimizer.globals` 配置
 */
const getGlobalsFromDefine = (define?: Record<string, string>) => {
	if (!define) return {};

	const globals: Required<GlobalPassOption> = {
		typeofs: {},
		vars: {},
		envs: {},
	};

	if (define) {
		Object.entries(define).forEach(([key, value]) => {
			if (key.startsWith("typeof ")) {
				globals.typeofs[key.replace("typeof", "").trim()] = value;
			} else {
				globals.vars[key] = value;
			}
		});
	}

	return globals;
};

export const getSwcOptions = (
	options: GetOptions,
	config: SystemConfig,
	outJsExt: string,
): SwcOptions => {
	const { cwd } = config;
	const {
		type: format,
		swcOptions = {},
		targets,
		sourcemap,
		externalHelpers,
		alias,
		define,
		react,
		css,
	} = options;

	const plugins: Array<[string, Record<string, any>]> = [];

	plugins.push([
		"@swc/plugin-transform-imports",
		{
			// 是否判断 allowImportingTsExtensions:true 后开启
			// TODO: cts, mts
			"^(.*?)(\\.ts)$": {
				handleDefaultImport: true,
				transform: "{{matches.[1]}}.js",
			},
			...(css?.lessCompile && {
				"^(.*?)(\\.less)$": {
					handleDefaultImport: true,
					transform: "{{matches.[1]}}.css",
				},
			}),
		},
	]);

	if (css?.cssModules) {
		// 注意顺序, 在 transform-imports 之后
		plugins.push([
			"swc-plugin-css-modules",
			{ generate_scoped_name: css.cssModules },
		]);
	}

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
				optimizer: {
					globals: getGlobalsFromDefine(define),
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
		swcOptions,
		{
			swcrc: false,
			configFile: false,
			module: {
				type: swcModuleMap[format],
				resolveFully: true,
				outFileExtension: outJsExt, // 1.10.1 支持. 不生效 ??
			},
			env: { targets },
			sourceMaps: sourcemap,
		} as SwcOptions,
	]);
};
