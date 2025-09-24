import { requireResolve } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

export const pluginLess: PluginFn = chain => {
	const lessRule = chain.module.rule("less").test(/\.less$/i);

	const cssRule = chain.module.rule("css");

	// copy css rule uses
	for (const id of Object.keys(cssRule.uses.entries())) {
		const loader = cssRule.uses.get(id);
		const options = loader.get("options") ?? {};
		if (id === "css-loader") {
			// less-loader +1
			options.importLoaders += 1;
		}
		lessRule.use(id).loader(loader.get("loader")).options(options);
	}

	lessRule
		.use("less-loader")
		.loader(requireResolve("less-loader"))
		.options({
			implementation: requireResolve("less"),
			lessOptions: {},
		});
};
