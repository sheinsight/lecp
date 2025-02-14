import type { PluginFn } from "../chain.ts";

export const pluginEsm: PluginFn = (chain, { options: { externals } }) => {
	chain.experiments({
		outputModule: true,
	});

	chain.output.module(true);

	// webpack output.modern-module (修复和 module 默认值不一致)
	// @ref: https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts
	chain.output.chunkLoading("import").workerChunkLoading("import");

	chain.externalsType("module-import");

	// chain.optimization.concatenateModules(true); // production 默认启用

	// umd  自动externals  (peerDependencies) ??
	// cjs, esm 自动externals  (dependencies. peerDependencies ) ??

	// 注意: external { 'react': 'React' }  -> Object.keys(external) -> ['react']
	// chain.externals(
	// 	Array.isArray(externals) ? externals : Object.keys(externals),
	// );
};
