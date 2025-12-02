// import { createRequire } from "node:module";
import type {
	GlobalPassOption,
	ModuleConfig,
	Options as SwcOptions,
} from "@swc/types";
import deepmerge from "deepmerge";
import type ts from "typescript";
import type { SystemConfig } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import type { Alias, Format, FormatType } from "../define-config.ts";

// const require = createRequire(import.meta.url);

// '@': './src' -> '@/*': ['./src/*'],
// "@alias": ["./src/alias-1", "./src/alias-2"] -> "@alias/*": ["./src/alias-1/*", "./src/alias-2/*"]
// TODO: 兼容性 config 统一format
// '@': 'src' -> '@/*': ['./src/*'],
// '@': './src/' -> '@/*': ['./src/*'],
// 绝对路径处理 ??

type TsPaths = NonNullable<ts.CompilerOptions["paths"]>;

const aliasToTsPaths = (alias: Alias = {}) => {
	return Object.entries(alias).reduce((acc, [name, value]) => {
		if (Array.isArray(value)) {
			acc[`${name}/*`] = value.map(v => `${v}/*`);
		} else {
			acc[`${name}/*`] = [`${value}/*`];
		}
		return acc;
	}, {} as TsPaths);
};

// https://rspack.rs/zh/config/resolve#resolvealias
// https://webpack.js.org/configuration/resolve/#resolvealias
// https://www.typescriptlang.org/tsconfig/#paths

// '@/*': ['./src/*'] -> '@': './src'
// "@alias/*": ["./src/alias-1/*", "./src/alias-2/*"] -> "@alias": ["./src/alias-1", "./src/alias-2"]
export const tsPathsToAlias = (paths: TsPaths = {}): Alias => {
	return Object.entries(paths).reduce((acc, [name, value]) => {
		acc[name.replace("/*", "")] = value.map(v => v.replace("/*", ""));
		return acc;
	}, {} as Alias);
};

interface GetOptions {
	type: Format["type"];
	minify: Format["minify"];
	swcOptions?: SwcOptions;
	targets: FinalUserConfig["targets"];
	sourcemap: FinalUserConfig["sourcemap"];
	externalHelpers?: FinalUserConfig["externalHelpers"];
	react?: FinalUserConfig["react"];
	css?: FinalUserConfig["css"];
	alias: FinalUserConfig["alias"];
	define: FinalUserConfig["define"];
	shims?: FinalUserConfig["shims"];
	outJsExt: string;
	resolveDir?: boolean;
	mode: Format["mode"];
}

const swcModuleMap = {
	esm: "es6",
	cjs: "commonjs", // 和 nodenext 区别??
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
		// css,
		minify,
		// shims,
		// outJsExt,
		// mode,
	} = options;

	const plugins: Array<[string, Record<string, any>]> = [];

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
					runtime: react?.runtime,
					importSource: react?.importSource,
				},
				optimizer: {
					// @swc/core@1.2.101+ 支持无需插件实现 @see https://swc.rs/docs/configuration/compilation#jsctransformoptimizerglobals
					globals: getGlobalsFromDefine(define),
				},
			},
			baseUrl: cwd,
			// 暂不支持替换 require 和 require.resolve @see https://github.com/swc-project/swc/issues/3614
			paths: aliasToTsPaths(alias),

			// @refer: https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin#minimizeroptions
			minify: minify
				? {
						mangle: true,
						compress: {
							passes: 2,
						},
						format: {
							comments: false,
						},
					}
				: undefined,

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
				// node@14+ 支持在 cjs import(),无需转换
				// ignoreDynamic: true,
				// outFileExtension: outJsExt.slice(1), // 1.10.1+ 支持
			},
			minify,
			sourceMaps: sourcemap,
			env: { targets },
		} as SwcOptions,
	]);
};
