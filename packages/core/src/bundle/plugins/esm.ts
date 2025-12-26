// import rspack from "@rspack/core";
import type { PluginFn } from "../chain.ts";

export const pluginEsm: PluginFn = chain => {
	chain.experiments({ outputModule: true });
	chain.output.module(true);

	// default -> 'modern-module' invalid (webpack right)
	chain.externalsType("module-import");

	// output.modern-module (修复和 module 默认值不一致)
	// @ref: https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts
	chain.output.chunkLoading("import").workerChunkLoading("import");

	// node.__filename, node.__dirname
	// outputModule:true -> 'node_modules'; auto shims

	// output.module:true -> 'module'
	chain.output.chunkFormat("module");

	chain.module.parser.set("javascript", {
		importMeta: false,
		requireResolve: false, // rspack only, webpack@5.98.0+: /* webpackIgnore: true */ + commonjsMagicComments: true,
		requireAsExpression: false, // rspack only
		requireDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
		importDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
	});

	// chain.optimization.concatenateModules(true); // production 默认启用
	chain.optimization.avoidEntryIife(true); // production (rspack 默认不启用，webpack@5.95.0+ 默认启用 )

	// rspack@1.6.0+ 支持 (暂时不开启，目前对于有import style的库会生成额外的 runtime.js)
	// chain.plugin("esm-lib").use(rspack.experiments.EsmLibraryPlugin);
	// chain.optimization.runtimeChunk("single");
};
