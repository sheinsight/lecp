import rspack from "@rspack/core";
import type { PluginFn } from "../chain.ts";

export const pluginMinimize: PluginFn = (chain, { options }) => {
	const { minify } = options;

	chain.optimization
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
};
