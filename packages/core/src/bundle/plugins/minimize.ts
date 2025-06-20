import rspack from "@rspack/core";
import { getBrowsersList } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

export const pluginMinimize: PluginFn = (chain, { options }) => {
	const { minify } = options;

	if (!minify) {
		// remove some comments
		chain.optimization
			.minimize(true)
			.minimizer("js")
			.use(rspack.SwcJsMinimizerRspackPlugin, [
				{
					extractComments: true,
					// https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin#minimizeroptions
					minimizerOptions: {
						format: {
							comments: "some",
							preserve_annotations: true,
						},
						mangle: false,
						minify: false,
						compress: false,
					},
				},
			])
			.end();
	} else {
		chain.optimization
			.minimize(minify)
			.minimizer("js")
			.use(rspack.SwcJsMinimizerRspackPlugin, [
				{
					extractComments: true,
					// https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin#minimizeroptions
					minimizerOptions: {
						format: {
							comments: "some",
							preserve_annotations: true,
						},
					},
				},
			])
			.end()
			.minimizer("css")
			.use(rspack.LightningCssMinimizerRspackPlugin, [
				{
					// https://rspack.rs/plugins/rspack/lightning-css-minimizer-rspack-plugin#minimizeroptions
					minimizerOptions: {
						targets: getBrowsersList({ targets: options.targets }),
					},
				},
			]);
	}
};
