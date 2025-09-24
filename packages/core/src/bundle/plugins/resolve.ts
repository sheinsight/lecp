import path from "node:path";
import ts from "typescript";
import type { Alias } from "../../define-config.ts";
import type { PluginFn } from "../chain.ts";

// '@': './src'  -> '@': path.join(cwd, 'src'),
// '@': ['./src']  -> '@': [path.join(cwd, 'src')],
export const aliasToWebpackAlias = (
	alias: Alias | undefined = {},
	cwd: string,
): Alias => {
	return Object.entries(alias).reduce((acc, [name, value]) => {
		if (Array.isArray(value)) {
			value = value.map(v => (path.isAbsolute(v) ? v : path.join(cwd, v)));
		} else {
			acc[name] = path.isAbsolute(value) ? value : path.join(cwd, value);
		}

		return acc;
	}, {} as Alias);
};

export const pluginResolve: PluginFn = (chain, { options, config }) => {
	const { cwd } = config;
	const { alias } = options;

	chain.resolve.tsConfig({
		configFile: ts.findConfigFile(cwd, ts.sys.fileExists)!,
	});

	chain.resolve.alias.merge(aliasToWebpackAlias(alias, cwd));

	chain.resolve.extensions.merge([
		".ts",
		".tsx",
		".mts",
		".cts",
		".js",
		".jsx",
		".mjs",
		".cjs",
	]);
	chain.resolve.extensionAlias.merge({
		".js": [".ts", ".tsx", ".js", ".jsx"],
		".jsx": [".tsx", ".jsx"],
		".mjs": [".mts", ".mjs"],
		".cjs": [".cts", ".cjs"],
	});
};
