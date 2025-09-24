import { type LightningcssLoaderOptions, rspack } from "@rspack/core";
import type RspackChain from "rspack-chain";
import { getBrowsersList, requireResolve } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

export const pluginCss: PluginFn = (chain: RspackChain, { options }) => {
	const { css, targets } = options;

	const cssModulesOptions = css?.cssModules
		? {
				modules: {
					namedExport: false, // 兼容 css-loader@6
					// *.module.css or src/**/*.css
					auto: (resourcePath: string) =>
						!/[\\/]node_modules[\\/]/.test(resourcePath) ||
						/\.module\.$/i.test(resourcePath),
					localIdentName: css?.cssModules,
				},
			}
		: {};

	chain.module
		.rule("css")
		.test(/\.css$/i)
		.use("css-extract-loader")
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

	chain
		.plugin("css-extract")
		.use(rspack.CssExtractRspackPlugin, [{ filename: "[name].css" }]);
};
