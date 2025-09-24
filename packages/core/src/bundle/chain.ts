import { createRequire } from "node:module";
import type { RspackOptions } from "@rspack/core";
import RspackChain from "rspack-chain";
import type { SystemConfig } from "../build.ts";
import type { FinalBundleFormat } from "../define-config.ts";
import { getBrowsersList } from "../util/index.ts";
import { NodePrefixPlugin } from "./node-prefix.ts";
import { pluginAsset } from "./plugins/asset.ts";
import { pluginCjs } from "./plugins/cjs.ts";
import { pluginCss } from "./plugins/css.ts";
import { pluginDefine } from "./plugins/define.ts";
import { pluginEsm } from "./plugins/esm.ts";
import { pluginLess } from "./plugins/less.ts";
import { pluginMinimize } from "./plugins/minimize.ts";
import { pluginOutput } from "./plugins/output.ts";
import { pluginResolve } from "./plugins/resolve.ts";
import { pluginScript } from "./plugins/script.ts";

const require = createRequire(import.meta.url);

export type PluginFn = (
	chain: RspackChain,
	options: { options: FinalBundleFormat; config: SystemConfig },
) => void;

export function getRspackConfig(
	options: FinalBundleFormat,
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

	if (!targets.node) {
		const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
		chain.plugin("node-polyfill").use(NodePolyfillPlugin, []);
		chain.plugin("node-prefix").use(NodePrefixPlugin, []);
	}

	chain.externals(externals);

	chain.cache(watch).experiments({ cache: watch });

	// perf
	chain.experiments({ nativeWatcher: true, lazyBarrel: true });

	[
		pluginOutput,
		pluginScript,
		pluginCss,
		options.css?.lessCompile && pluginLess,
		pluginAsset,
		pluginMinimize,
		pluginResolve,
		pluginDefine,
		format === "esm" && pluginEsm,
		format === "cjs" && pluginCjs,
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
