import rspack from "@rspack/core";
import type { PluginFn } from "../chain.ts";

export const pluginDefine: PluginFn = (chain, options) => {
	const { define } = options.options;
	chain.plugin("define").use(rspack.DefinePlugin, [define]);
};
