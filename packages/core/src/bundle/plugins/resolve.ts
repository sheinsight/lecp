import path from "node:path";
import ts from "typescript";
import type { PluginFn } from "../chain.ts";

// '@': './src'  -> '@': path.join(cwd, 'src'),
export const aliasToWebpackAlias = (
	alias: Record<string, string> | undefined = {},
	cwd: string,
): Record<string, string> => {
	return Object.entries(alias).reduce(
		(acc, [name, value]) => {
			acc[name] = path.isAbsolute(value) ? value : path.join(cwd, value);
			return acc;
		},
		{} as Record<string, string>,
	);
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
		".js",
		".jsx",
		".mjs",
		".cjs",
	]);
	chain.resolve.extensionAlias.merge({
		".js": [".js", ".ts", ".tsx"],
		".mjs": [".mjs", ".mts"],
		".cjs": [".cjs", ".cts"],
	});
};
