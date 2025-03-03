import type { PluginFn } from "../chain.ts";

export const pluginEsm: PluginFn = chain => {
	chain.experiments({ outputModule: true });
	chain.output.module(true);

	// output.modern-module (修复和 module 默认值不一致)
	// @ref: https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts
	chain.output.chunkLoading("import").workerChunkLoading("import");

	// node.__filename, node.__dirname
	// outputModule:true -> 'node_modules'; auto shims

	// default -> 'modern-module' invalid (webpack right)
	chain.externalsType("module-import");

	chain.module.parser.set("javascript", {
		importMeta: false,
		requireResolve: false, // rspack only, webpack(5.98.0+): /* webpackIgnore: true */ + commonjsMagicComments: true,
		requireAsExpression: false, // rspack only
		requireDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
		importDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
	});

	// chain.optimization.concatenateModules(true); // production 默认启用
	// chain.optimization.avoidEntryIife(true); // production 默认启用 5.95.0+

	// umd  自动externals  (peerDependencies) ??
	// cjs, esm 自动externals  (dependencies. peerDependencies ) ??

	// 注意: external { 'react': 'React' }  -> Object.keys(external) -> ['react']
	// chain.externals(
	// 	Array.isArray(externals) ? externals : Object.keys(externals),
	// );
};
