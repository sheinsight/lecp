import type { Compiler, RspackPluginInstance } from "@rspack/core";

export class NodePrefixPlugin implements RspackPluginInstance {
	apply(compiler: Compiler): void {
		compiler.options.plugins.push(
			// https://github.com/webpack/webpack/issues/14166
			// remove `node:` prefix
			new compiler.webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
				resource.request = resource.request.replace(/^node:/, "");
			}),
		);
	}
}
