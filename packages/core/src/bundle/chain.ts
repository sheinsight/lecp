import { createRequire } from "module";
import path from "path";
import rspack, {
	type LightningcssLoaderOptions,
	type RspackOptions,
} from "@rspack/core";
import RspackChain, { type Rule } from "rspack-chain";
import ts from "typescript";
import type { BundleOptions } from ".";
import type { SystemConfig } from "../build";
import { getSwcOptions } from "../bundless/swc";
import { getBrowsersList, toUmdName } from "../util";

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

function addAssetRule(type: string, rule: Rule) {
	rule.oneOf(`asset-${type}-raw`).type("asset/source").resourceQuery(/raw/);
	rule.oneOf(`asset-${type}-url`).type("asset/resource").resourceQuery(/url/);
	rule
		.oneOf(`asset-${type}-inline`)
		.type("asset/inline")
		.resourceQuery(/inline/);
	rule
		.oneOf(`asset-${type}`)
		.type("asset")
		.parser({
			dataUrlCondition: {
				maxSize: 10 * 1024,
			},
		});
}

export function getRspackConfig(
	options: BundleOptions,
	config: SystemConfig,
): RspackOptions {
	const { cwd, watch } = config;
	const {
		type: format,
		fileName,
		entry,
		outDir,
		name,
		sourcemap,
		minify,
		css,
		targets,
		extraCompile,
	} = options;

	const rspackChain = new RspackChain();

	rspackChain.context(cwd);
	rspackChain.entry(fileName).add(entry);
	rspackChain.output
		.path(outDir)
		.filename("[name].js")
		.library({
			name: toUmdName(name),
			type: rspackModuleMap[format],
		});

	rspackChain.module.when(sourcemap, module => {
		module
			.rule("source-map")
			.test(/\.(js|mjs|jsx|ts|tsx|css)$/)
			.enforce("pre")
			.use("sourcemap")
			.loader(requireResolve("source-map-loader"))
			.end();
	});

	addAssetRule(
		"image",
		rspackChain.module.rule("asset-image").test(/\.(png|jpe?g|gif|webp)$/i),
	);

	addAssetRule(
		"font",
		rspackChain.module.rule("asset-font").test(/\.(woff|woff2|eot|ttf|otf)$/i),
	);

	rspackChain.module
		.rule("mjs")
		.test(/\.m?js$/i)
		.resolve.fullySpecified(false);

	const swcOptions = getSwcOptions(
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
	);

	rspackChain.module
		.rule("script")
		.test(/\.(js|mjs|cjs|jsx|ts|mts|cts|tsx)$/i)
		.type("javascript/auto")
		.exclude.add({
			and: [
				/[\\/]node_modules[\\/]/,
				{
					not: extraCompile?.map(
						pkg => new RegExp(`node_modules[\\\\/]${pkg}[\\\\/]`),
					),
				},
			],
		})
		.end()
		.use("swc")
		.loader("builtin:swc-loader")
		.options(swcOptions);

	const cssModulesOptions = css?.cssModules
		? {
				modules: {
					namedExport: false, // 兼容 css-loader@6
					// *.module.css or src/**/*.css
					auto: (resourcePath: string) =>
						!/[\\/]node_modules[\\/]/.test(resourcePath),
					localIdentName: css?.cssModules,
				},
			}
		: {};

	rspackChain.module
		.rule("css")
		.test(/\.css$/i)
		.use("extract-css-loader")
		.loader(rspack.CssExtractRspackPlugin.loader)
		.end()
		.use("css-loader")
		.loader(requireResolve("css-loader"))
		.options({
			importLoaders: 1, // lightningcss-loader
			...cssModulesOptions,
		})
		.end()
		.use("lightningcss-loader")
		// https://github.com/fz6m/lightningcss-loader 支持 plugins (custom transforms)
		.loader("builtin:lightningcss-loader")
		.options({
			targets: getBrowsersList({ targets }),
		} as LightningcssLoaderOptions);

	// rspackConfig.module.rule("less").test(/\.less$/i)

	rspackChain.plugin("css-extract").use(rspack.CssExtractRspackPlugin, [
		{
			filename: "[name].css",
		},
	]);

	rspackChain.resolve.tsConfig({
		configFile: ts.findConfigFile(cwd, ts.sys.fileExists)!,
	});

	const alias = aliasToWebpackAlias(options.alias, cwd);
	for (const [name, value] of Object.entries(alias)) {
		rspackChain.resolve.alias.set(name, value);
	}

	rspackChain.resolve.extensions
		.add(".ts")
		.add(".tsx")
		.add(".js")
		.add(".jsx")
		.add(".mjs")
		.add(".cjs");

	rspackChain.resolve.extensionAlias
		.set(".js", [".js", ".ts", ".tsx"])
		.set(".mjs", [".mjs", ".mts"])
		.set(".cjs", [".cjs", ".cts"]);

	rspackChain.externals(options.externals);

	rspackChain.devtool(sourcemap ? "source-map" : false);

	rspackChain.optimization
		.minimize(minify)
		.minimizer("js")
		.use(rspack.SwcJsMinimizerRspackPlugin, [
			{
				extractComments: true,
				minimizerOptions: {},
			},
		])
		.end()
		.minimizer("css")
		.use(rspack.LightningCssMinimizerRspackPlugin, [
			{
				minimizerOptions: {},
			},
		]);

	rspackChain.cache(watch).experiments({ cache: watch });

	if (options.modifyRspackChain) {
		options.modifyRspackChain(rspackChain);
	}

	let rspackConfig = rspackChain.toConfig();
	if (options.modifyRspackConfig) {
		rspackConfig = options.modifyRspackConfig?.(rspackConfig);
	}

	console.log(rspackChain.toString());

	return rspackConfig;
}
