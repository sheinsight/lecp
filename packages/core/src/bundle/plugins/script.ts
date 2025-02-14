import type RspackChain from "rspack-chain";
import { getSwcOptions } from "../../bundless/swc.ts";
import type { PluginFn } from "../chain.ts";

export const pluginScript: PluginFn = (
	chain: RspackChain,
	{ options, config },
) => {
	const { extraCompile } = options;

	chain.module
		.rule("mjs")
		.test(/\.m?js$/i)
		.resolve.fullySpecified(false);

	const swcOptions = getSwcOptions(
		{ ...options, alias: {}, define: {}, css: {}, outJsExt: ".js" },
		config,
	);

	chain.module
		.rule("js")
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
};
