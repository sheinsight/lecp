import type { RspackOptions } from "@rspack/core";
import RspackChain from "rspack-chain";
import type { SystemConfig } from "../build.ts";
import { getBrowsersList } from "../util/index.ts";
import type { BundleOptions } from "./index.ts";
import { pluginAsset } from "./plugins/asset.ts";
import { pluginCss } from "./plugins/css.ts";
import { pluginEsm } from "./plugins/esm.ts";
import { pluginMinimize } from "./plugins/minimize.ts";
import { pluginOutput } from "./plugins/output.ts";
import { pluginResolve } from "./plugins/resolve.ts";
import { pluginScript } from "./plugins/script.ts";

export type PluginFn = (
	chain: RspackChain,
	options: { options: BundleOptions; config: SystemConfig },
) => void;

export function getRspackConfig(
	options: BundleOptions,
	config: SystemConfig,
): RspackOptions {
	const chain = new RspackChain();

	const { cwd, watch } = config;
	const { type: format, fileName, entry, targets, externals } = options;

	chain.context(cwd);
	chain.entry(fileName).add(entry);
	chain
		.mode("production")
		.target(`browserslist:${getBrowsersList({ targets })}`);

	chain.externals(externals);
	chain.cache(watch).experiments({ cache: watch });

	[
		pluginOutput,
		pluginScript,
		pluginCss,
		pluginAsset,
		pluginMinimize,
		pluginResolve,
		format === "esm" && pluginEsm,
	]
		.filter(Boolean)
		.forEach(
			plugin =>
				typeof plugin === "function" && plugin(chain, { options, config }),
		);

	options.modifyRspackChain?.(chain);

	let rspackConfig = chain.toConfig();
	if (options.modifyRspackConfig) {
		rspackConfig = options.modifyRspackConfig?.(rspackConfig);
	}

	return rspackConfig;
}
