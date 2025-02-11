import { createRequire } from "module";
import path from "path";
import rspack, {
	type Compiler,
	type LightningcssLoaderOptions,
	type SwcLoaderOptions,
	type RspackOptions,
} from "@rspack/core";
import ts from "typescript";
import type { SystemConfig, Watcher } from "../build.ts";
import { getSwcOptions } from "../bundless/swc.ts";
import type { FinalUserConfig } from "../config.ts";
import type { BundleFormat } from "../define-config.ts";
import { getBrowsersList, toUmdName } from "../util/index.ts";
import { logger } from "../util/logger.ts";

type BundleOptions = Omit<FinalUserConfig, "format"> & Required<BundleFormat>;

const requireResolve = (id: string) => {
	try {
		return require.resolve(id);
	} catch {
		return createRequire(import.meta.url).resolve(id);
	}
};

const rspackModuleMap = {
	esm: "module",
	cjs: "commonjs",
	umd: "umd",
} as const;

// '@': './src'  -> '@': path.join(cwd, 'src'),
const aliasToWebpackAlias = (
	alias: Record<string, string> = {},
	cwd: string,
) => {
	return Object.entries(alias).reduce(
		(acc, [name, value]) => {
			acc[name] = path.isAbsolute(value) ? value : path.join(cwd, value);
			return acc;
		},
		{} as Record<string, string>,
	);
};

function getRspackConfig(
	options: BundleOptions,
	config: SystemConfig,
): RspackOptions {
	const { cwd, watch } = config;
	const {
		type: format,
		fileName,
		entry,
		sourcemap,
		minify,
		css,
		modifyRspackConfig,
		targets,
		extraCompile,
	} = options;

	const srcDir = path.join(cwd, "src");
	const cssModulesOptions = css?.cssModules
		? {
				modules: {
					namedExport: false, // 兼容 css-loader@6
					// *.module.css or src/**/*.css
					auto: (resourcePath: string) => resourcePath.includes(srcDir),
					localIdentName: css?.cssModules,
				},
			}
		: {};

	const rspackConfig: RspackOptions = {
		mode: "production",
		// target: [], // browserslist:value, web, node
		target: `browserslist: ${getBrowsersList({ targets })}`,
		context: cwd,
		entry: {
			[fileName]: entry,
		},
		output: {
			path: options.outDir,
			filename: "[name].js", // TODO: [name].cjs, [name].mjs
			library: {
				name: toUmdName(options.name),
				type: rspackModuleMap[format],
			},
			// clean: true,
		},
		module: {
			rules: [
				sourcemap && {
					enforce: "pre",
					test: /\.(js|mjs|jsx|ts|tsx|css)$/,
					loader: requireResolve("source-map-loader"),
				},
				// https://github.com/webpack/webpack/issues/11467
				{
					test: /\.m?js$/i,
					resolve: {
						fullySpecified: false,
					},
				},
				// asset - image
				{
					test: /\.(png|svg|jpg|jpeg|gif)$/i,
					oneOf: [
						{
							type: "asset/source",
							resourceQuery: /raw/,
						},
						{
							type: "asset/resource",
							resourceQuery: /url/,
						},
						{
							resourceQuery: /inline/,
							type: "asset/inline",
						},
						{
							type: "asset",
							parser: {
								dataUrlCondition: {
									maxSize: 10 * 1024,
								},
							},
						},
					],
				},
				// asset - font
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					oneOf: [
						{
							type: "asset/source",
							resourceQuery: /raw/,
						},
						{
							type: "asset/resource",
							resourceQuery: /url/,
						},
						{
							resourceQuery: /inline/,
							type: "asset/inline",
						},
						{
							type: "asset",
							parser: {
								dataUrlCondition: {
									maxSize: 10 * 1024,
								},
							},
						},
					],
				},
				// asset - svg
				// TODO: ?react -> svgr-loader

				// script
				{
					test: /\.(js|mjs|cjs|jsx|ts|mts|cts|tsx)$/i,
					type: "javascript/auto",
					exclude: [
						{
							and: [
								/[\\/]node_modules[\\/]/,
								{
									not: extraCompile?.map(
										pkg => new RegExp(`node_modules[\\\\/]${pkg}[\\\\/]`),
									),
								},
							],
						},
					],
					loader: "builtin:swc-loader",
					options: getSwcOptions(
						{
							...options,
							alias: {},
							define: {},
							css: {
								...css,
								cssModules: undefined,
							},
							outJsExt: ".js",
						},
						config,
					) as SwcLoaderOptions,
				},

				// style
				{
					test: /\.css$/i,
					use: [
						{
							loader: rspack.CssExtractRspackPlugin.loader,
						},
						{
							loader: requireResolve("css-loader"),
							options: {
								importLoaders: 1, // lightningcss-loader
								...cssModulesOptions,
							},
						},
						{
							// https://github.com/fz6m/lightningcss-loader 支持 plugins (custom transforms)
							loader: "builtin:lightningcss-loader",
							options: {
								targets: getBrowsersList({ targets }),
							} as LightningcssLoaderOptions,
						},
					],
				},
				{
					test: /\.less$/i,
					// TODO: 合并
					use: [
						{
							loader: rspack.CssExtractRspackPlugin.loader,
						},
						{
							loader: requireResolve("css-loader"),
							options: {
								importLoaders: 2, // lightningcss-loader + less-loader
								...cssModulesOptions,
							},
						},
						{
							// https://github.com/fz6m/lightningcss-loader 支持 plugins (custom transforms)
							loader: "builtin:lightningcss-loader",
							options: {
								targets: getBrowsersList({ targets }),
							} as LightningcssLoaderOptions,
						},
						{
							loader: requireResolve("less-loader"),
							options: {
								implements: requireResolve("less"),
								lessOptions: {},
							},
						},
					],
				},
			],
		},
		plugins: [
			new rspack.CssExtractRspackPlugin({
				filename: "[name].css",
			}),
		],
		resolve: {
			tsConfig: ts.findConfigFile(cwd, ts.sys.fileExists),
			alias: aliasToWebpackAlias(options.alias, cwd),
			extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
			extensionAlias: {
				".js": [".js", ".ts", ".tsx"],
				".mjs": [".mjs", ".mts"],
				".cjs": [".cjs", ".cts"],
			},
		},
		externals: options.externals,
		devtool: sourcemap ? "source-map" : false,
		optimization: {
			minimize: !!minify,
			minimizer: [
				new rspack.SwcJsMinimizerRspackPlugin({
					extractComments: true,
					minimizerOptions: {},
				}),
				new rspack.LightningCssMinimizerRspackPlugin({
					minimizerOptions: {},
				}),
			],
		},
		// bail: !watch,
		// infrastructureLogging: {
		// 	level: "error",
		// },
		cache: watch ? true : false,
		experiments: {
			cache: watch ? true : false,
		},
	};

	return modifyRspackConfig ? modifyRspackConfig(rspackConfig) : rspackConfig;
}

type CallbackFunction = Parameters<Compiler["run"]>[0];
const compilerHandler: CallbackFunction = (err, stats) => {
	if (err || stats?.hasErrors()) {
		logger.error(err?.message || stats?.toString());
		return;
	}

	if (stats?.startTime && stats?.endTime) {
		console.log(`${(stats.endTime - stats.startTime) / 1000}s`);
	}
};

export const bundleFiles = async (
	options: BundleOptions,
	config: SystemConfig,
): Promise<Watcher | undefined> => {
	const { watch } = config;

	const rspackConfig = getRspackConfig(options, config);
	// console.log(JSON.stringify(rspackConfig, null, 2));
	const compiler = rspack(rspackConfig);

	if (watch) {
		const { watcher } = compiler.watch({}, compilerHandler);
		return watcher;
	}

	// node@22.0.0
	// const { promise, resolve } = Promise.withResolvers<undefined>();
	return new Promise(resolve => {
		compiler.run((err, stats) => {
			compilerHandler(err, stats);
			compiler.close(() => resolve(undefined));
		});
	});
};
