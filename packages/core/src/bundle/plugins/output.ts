import { getOutJsExt, toUmdName } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

const rspackModuleMap = {
	esm: "modern-module", // webpack@5.93+
	cjs: "commonjs-static",
	umd: "umd",
} as const;

export const pluginOutput: PluginFn = (chain, { options, config: { pkg } }) => {
	const { type: format, outDir, name, sourcemap, targets } = options;

	const outJsExt = getOutJsExt(!!targets.node, pkg.type === "module", format);

	// chunk ext ???
	chain.output
		.path(outDir)
		.filename(`[name].${outJsExt}`)
		.library({
			// 用户显式传入的 name 直接使用，未传则从 pkg.name 自动生成规范的 UMD 全局变量名
			name: format === "umd" ? (name ?? toUmdName(pkg.name)) : undefined,
			type: rspackModuleMap[format],
		});

	chain.devtool(sourcemap ? "source-map" : false);

	chain.module.when(sourcemap, module => {
		module
			.rule("source-map")
			.test(/\.m?js$/)
			.enforce("pre")
			.set("extractSourceMap", true)
			.end();
	});
};
