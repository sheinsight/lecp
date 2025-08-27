import { getOutJsExt, requireResolve, toUmdName } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

const rspackModuleMap = {
	esm: "modern-module", // webpack@5.93+
	cjs: "commonjs",
	umd: "umd",
} as const;

export const pluginOutput: PluginFn = (chain, { options, config: { pkg } }) => {
	const { type: format, outDir, name, sourcemap, targets, clean } = options;

	const outJsExt = getOutJsExt(!!targets.node, pkg.type === "module", format);

	// chunk ext ???
	chain.output
		.path(outDir)
		.filename(`[name].${outJsExt}`)
		.library({
			name: format === "umd" ? toUmdName(name) : undefined,
			type: rspackModuleMap[format],
		});

	chain.devtool(sourcemap ? "source-map" : false);

	chain.output.clean(clean);

	chain.module.when(sourcemap, module => {
		module
			.rule("source-map")
			.test(/\.(js|mjs|jsx|ts|tsx|css)$/)
			.enforce("pre")
			.use("source-map-loader")
			.loader(requireResolve("source-map-loader"))
			.end();
	});
};
