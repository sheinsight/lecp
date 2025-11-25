import type { PluginFn } from "../chain.ts";

export const pluginCjs: PluginFn = chain => {
	// node:
	// chunkFormat: commonjs
	// chunkLoading: 'require',
	// workerChunkLoading: 'async-node',

	// chrome:
	// chunkFormat: 'array-push',
	// chunkLoading: 'jsonp',
	// workerChunkLoading: 'import-scripts',

	// node+chrome: 不推荐
	// chunkFormat: 'array-push', // error
	// chunkLoading: 'jsonp', // universal error
	// workerChunkLoading: 'import-scripts',

	chain.output.chunkFormat("commonjs");

	// default -> 'commonjs'
	chain.externalsType("commonjs-import"); // rspack-only

	chain.module.parser.set("javascript", {
		importMeta: false,
		requireResolve: false, // rspack only, webpack@5.98.0+: /* webpackIgnore: true */ + commonjsMagicComments: true,
		requireAsExpression: false, // rspack only
		requireDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
		importDynamic: false, // rspack only, webpack: /* webpackIgnore: true */
	});
};
