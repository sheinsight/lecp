import type { Configuration as RspackConfig } from "@rspack/core";
import type Less from "less";
import type { TransformOptions as LightningCssTransformOptions } from "lightningcss";
import type RspackChain from "rspack-chain";

/** 编译类型 */
export type FormatType = "esm" | "cjs" | "umd";

/** 支持的编译引擎类型 */
// babel, webpack, ...
export type BuilderType = "swc" | "rspack";
// postcss ...
export type CssBuilderType = "lightningcss";
export type DtsBuilderType = "ts" | "swc";

export type DtsOptions = {
	/**
	 * 生成模式
	 * - "bundle": 使用 @microsoft/api-extractor 生成单个声明文件
	 * - "bundless": 保持源文件结构，生成多个声明文件
	 * @default "bundless"
	 */
	mode: FormatMode;

	/**
	 * 构建引擎
	 * - "ts": TypeScript 编译器（功能完整，支持 d.ts.map）
	 * - "swc": SWC 编译器（速度更快，但不支持 d.ts.map）
	 * @default "ts"
	 * @description 仅在 bundless + isolatedDeclarations 模式下可选择 swc
	 */
	builder?: DtsBuilderType;
};

export type FormatMode = "bundless" | "bundle";

/** 兼容目标环境 */
export type BuildTarget = Record<string, string | number>;

export type LessOptions = Less.Options;

export type LightningCssOptions = Omit<
	LightningCssTransformOptions<any>,
	"code" | "filename"
>;

export interface Format extends Omit<UserConfig, "format"> {
	type: FormatType;

	/**
	 * 编译模式
	 */
	mode?: FormatMode;

	/**
	 * 编译引擎
	 * @default
	 * - bundless : swc
	 * - bundle   : rspack
	 */
	builder?: BuilderType;

	/**
	 * 入口文件/文件夹
	 * bundless 默认 src
	 * bundle   默认 src/index.{(c|m)?(j,t)s(x)?}
	 */
	entry?: string;

	/**
	 * 输出目录
	 * @default {type}
	 * - esm -> es
	 * - cjs -> lib
	 * - umd -> umd
	 */
	outDir?: string;

	/**
	 * 是否开启压缩
	 */
	minify?: boolean;
}

export interface BundlessFormat extends Format {
	mode?: "bundless";

	type: Exclude<FormatType, "umd">;
}

export interface BundleFormat extends Format {
	mode?: "bundle";
	builder?: "rspack";

	/**
	 * 包名称
	 * @description 默认从 package.json 的 name 字段获取
	 * - umd:
	 *  命名转化 蛇形 -> 驼峰, 如 react-dom -> ReactDOM
	 *  对应 rspack的 output.library.name
	 *
	 */
	name?: string;

	/**
	 * 输出文件名称
	 * @default 'index'
	 */
	fileName?: string;

	/**
	 * 打包排除的 package
	 * @description 'auto' 自动排除 peerDependencies
	 * - esm,cjs: 排除 dependencies,devDependencies
	 */
	externals?: RspackConfig["externals"];

	/**
	 * 需要额外编译的 node_modules 包
	 * @default []
	 * @description 当第三方包的产物不满足当前编译目标时使用
	 * 默认不编译 node_modules 下的文件
	 * @example
	 *    ["immer"]: 忽略某个包 "immer"
	 *    [/node_modules[\\/]immer[\\/]/]: 忽略某个包 "immer"
	 *    [/[\\/]node_modules[\\/]/]: 忽略所有 node_modules
	 */
	extraCompile?: (string | RegExp)[];

	/**
	 * @private
	 */
	modifyRspackConfig?: (config: RspackConfig) => RspackConfig;

	/**
	 * @private
	 */
	modifyRspackChain?: (chain: RspackChain) => void;
}

type ProcessDtsAndCss<T extends Format> = Omit<T, "dts" | "css"> & {
	// omit dts boolean
	dts?: Required<NonNullable<Exclude<T["dts"], boolean>>>;
	// omit cssModules boolean
	css?: Omit<NonNullable<T["css"]>, "cssModules"> & {
		cssModules?: Exclude<NonNullable<T["css"]>["cssModules"], boolean>;
	};
};

type FinalFormat<T extends Format> = Required<ProcessDtsAndCss<T>>;

export type FinalBundlessFormat = FinalFormat<BundlessFormat>;
export type FinalBundleFormat = FinalFormat<BundleFormat>;

export type Alias = Record<string, string | string[]>;

export interface UserConfig {
	/**
	 * 继承的配置文件路径
	 * @description 支持相对路径和绝对路径(参考 tsconfig.json 的 extends)
	 */
	extends?: string;

	format: (BundlessFormat | BundleFormat)[];

	/**
	 * 兼容目标环境
	 * @default
	 *  - node环境: { targets: {node: "18.12.0"} }
	 *  - browser环境: { targets: { chrome: 55 } }
	 */
	targets?: BuildTarget;

	/**
	 * 开启后避免重复引入减少体积.但是需要使用时安装依赖
	 * swc 需要前置安装 @swc/helpers
	 * babel 需要前置安装 @babel/runtime
	 * @default false
	 */
	externalHelpers?: boolean;

	/**
	 * 是否生成 sourcemap
	 * @default true
	 */
	sourcemap?: boolean;

	/**
	 * 是否开启 shims
	 * @description
	 * - esm 产物, 支持 __dirname, __filename, require
	 * 	- legacy: false(默认), 支持降级到(node@20.11+), 使用 import.meta.{dirname, filename}
	 * 	- legacy: true,       支持降级到(node@10.12+), 使用 fileURLToPath
	 * - cjs 产物, 支持 import.meta.{url,dirname, filename}
	 *
	 */
	shims?: boolean | { legacy?: boolean };

	/**
	 * 设置别名
	 */
	alias?: Alias;

	/**
	 * 设置代码中的可用变量
	 * @description 参考 rspack.DefinePlugin
	 * @default {}
	 */
	define?: Record<string, string>;

	/**
	 * 是否生成声明文件
	 * @default true (mode:"bundless" + builder: "ts")
	 */
	dts?: boolean | DtsOptions;

	react?: {
		/**
		 * @default "classic"
		 * TODO: 自动读取 tsconfig.json 中的 jsx 配置
		 *  @see https://www.typescriptlang.org/tsconfig/#jsx
		 * - "react" -> "classic"
		 * - "react-jsx", "react-jsxdev" -> "automatic"
		 * - "preserve","react-native" -> unchanged
		 */
		jsxRuntime?: "automatic" | "classic";
	};

	css?: {
		/**
		 * 是否开启cssModules编译
		 *
		 * @description
		 * 配置后,umd,esm,cjs格式都将开启cssModules
		 *
		 * `true` -> `${pkgName}__[local]` 相当于加入 namespace
		 *
		 * 业务组件一般配置 `true` 即可,
		 * 有真实 cssModules 需求可以自定义
		 *  @see https://lightningcss.dev/css-modules.html#custom-naming-patterns
		 *
		 */
		cssModules?: string | boolean;

		/**
		 * bundless 模式下是否开启 less 编译
		 * @default true
		 */
		lessCompile?: boolean;

		/**
		 * less options
		 * @see https://lesscss.org/usage/#less-options
		 */
		lessOptions?: LessOptions;

		/**
		 * lightning css options
		 * @see https://lightningcss.dev/transpilation.html
		 */
		lightningCssOptions?: LightningCssOptions;
	};

	/**
	 * 编译时，忽略的目录或文件
	 * @description bundless 模式下需要
	 * 内置忽略列表(默认忽略测试相关文件)
	 * 支持 [glob](https://github.com/SuperchupuDev/tinyglobby)
	 */
	exclude?: string[];

	/**
	 * 清理输出目录
	 * @default true
	 */
	clean?: boolean;
}

export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export const defineConfig = (config: UserConfigExport): UserConfigExport =>
	config;
