/** 编译类型 */
export type FormatType = "esm" | "cjs" | "umd";

/** 支持的编译引擎类型 */
// babel, webpack, ...
export type BuilderType = "swc" | "rspack";

/** 兼容目标环境 */
export type BuildTarget = Record<string, string | number>;

export interface Format {
	type: FormatType;

	/**
	 * 编译引擎
	 * @default
	 * - bundless : swc
	 * - bundle   : rspack
	 */
	builder: BuilderType;

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
	 * - cjs -> lib,
	 * - umd -> umd
	 */
	outDir?: string;

	/**
	 * 是否开启压缩
	 */
	minify?: boolean;
}

export interface BundlessFormat extends Format {
	type: Exclude<FormatType, "umd">;
}

export interface BundleFormat extends Format {
	builder: "rspack";

	/**
	 * 包名称
	 * @description 默认从package.json的name字段获取
	 * - umd:
	 *  命名转化 蛇形 -> 驼峰, 如 react-dom -> ReactDOM
	 *  对应 rspack的 output.library.name,rollup 的 output.name
	 *
	 */
	name?: string;

	/**
	 * 输出文件名称
	 * @default 'index'
	 */
	fileName?: string;

	/**
	 * @private
	 */
	modifyRspackConfig?: (config: any) => any;

	/**
	 * 打包排除的 package
	 * @description 'auto' 自动排除 peerDependencies
	 * - esm,cjs: 排除 dependencies,devDependencies
	 */
	externals?: unknown; // Configuration['externals'];
}

export interface UserConfig {
	/**
	 * 继承的配置文件路径
	 * @description 支持相对路径和绝对路径(参考 tsconfig.json 的 extends)
	 */
	extends: string;

	format: (BundlessFormat | BundleFormat)[];

	/**
	 * 兼容目标环境
	 * @default
	 *  - node环境: { targets: {node: "18.12.0"} }
	 *  - browser环境: { targets: { chrome: 48 } }
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
	 * 编译时，忽略的目录或文件
	 * @description bundless 模式下需要
	 * 内置忽略列表
	 * @see constant.ts
	 */
	exclude?: string[];

	/**
	 * 设置别名
	 * @default { '@': './src' }
	 */
	alias?: Record<string, string>;

	/**
	 * 设置代码中的可用变量(swc 暂不支持)
	 * @description 参考 rspack.DefinePlugin
	 * @default {}
	 */
	define?: Record<string, string>;

	/**
	 * 是否生成声明文件
	 * @default true ("bundle" + "normal")
	 */
	dts?:
		| boolean
		| {
				/**
				 * bundle 使用 @microsoft/api-extractor 生成单个文件
				 */
				type: "bundle" | "bundless";

				/**
				 * bundless + tsconfig.json 配置 `isolatedDeclaration:true` 自动使用 fast 模式
				 */
				mode: "normal" | "fast"; // "isolated-decl"
		  };

	react?: {
		/**
		 * @default "automatic"
		 * ?? 自动读取 tsconfig.json 中的 jsx 配置
		 * "react" -> "classic"
		 * "react-jsx", "react-jsxdev" -> "automatic"
		 * "preserve" -> unchanged
		 */
		jsxRuntime?: "automatic" | "classic";
	};

	css?: {
		/**
		 * 是否开启cssModules编译
		 *
		 * @description
		 * 配置后,umd,esm,cjs格式都将开启cssModules
		 * 可以配置如下格式: [name]__[local]___[hash:base64:5]
		 *
		 * 业务组件不推荐开启 cssModules, 特别是使用hash
		 * 如有兼容代码需求.可以尝试使用 package.json的name作为前缀, `${pkgName}__[local]`
		 */
		cssModules?: string;

		// lessOptions?: LessOptions;

		/**
		 * lightning css options
		 */
	};
}

export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export const defineConfig = (config: UserConfigExport): UserConfigExport =>
	config;
