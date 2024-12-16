import { createRequire } from "node:module";
import type {
	GlobalPassOption,
	ModuleConfig,
	Options as SwcOptions,
} from "@swc/core";
import deepmerge from "deepmerge";
import type { SystemConfig } from "../build.ts";
import type { FormatType, UserConfig } from "../define-config.ts";

const require = createRequire(import.meta.url);

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

const swcModuleMap = {
	esm: "es6",
	cjs: "commonjs",
	umd: "umd",
} satisfies Record<FormatType, ModuleConfig["type"]>;

/**
 * webpack define 格式转换成 swc `jsc.transform.optimizer.globals` 配置
 */
const getGlobalsFromDefine = (define?: Record<string, string>) => {
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

	// allowImportingTsExtensions (ts->js), 暂不保留原始后缀,统一为 .js
	plugins.push([
		// "@shined/swc-plugin-transform-ts2js", {}
		require.resolve("@shined/swc-plugin-transform-ts2js"),
		{},
	]);

	// 修正 后缀
	// - 补全 cjs省略的 .js 后缀
	// - 修正 type:module 省略的 .cjs/.mjs 后缀
	// - 修正 less 编译导致的 .less -> .css 后缀
	plugins.push([
		require.resolve("@shined/swc-plugin-transform-extensions"),
		{
			extensions: {
				".js": outJsExt,
				".mjs": outJsExt,
				".cjs": outJsExt,
				/** lessCompile  */
				...(css?.lessCompile && { ".less": ".css" }),
			},
			addExtension: true,
		},
	]);

	// TODO: format === "cjs" 时， import.meta.filename, import.meta.dirname

	if (css?.cssModules) {
		// 注意顺序, 在 transform-extensions 之后
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
		// swc isModule: true, defined multiple times will error @see https://github.com/swc-project/swc/issues/4589
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
					// @swc/core@1.2.101+ 支持无需插件实现 @see https://swc.rs/docs/configuration/compilation#jsctransformoptimizerglobals
					globals: getGlobalsFromDefine(define),
				},
			},
			baseUrl: cwd,
			// 暂不支持替换 require 和 require.resolve @see https://github.com/swc-project/swc/issues/3614
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
				resolveFully: true, // 和插件配合, 不加 导致 ./xx/index.ts -> ./xx ??
			},
			env: { targets },
			sourceMaps: sourcemap,
		} as SwcOptions,
	]);
};
