import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		{
			type: "umd",
			fileName: "index.min",
			externals: {
				react: "React",
				"react-dom": "ReactDOM",
			},
			clean: false,
		},
		{
			type: "umd",
			minify: false,
			externals: {
				react: "React",
				"react-dom": "ReactDOM",
			},
			clean: false,
		},
	],
	define: {
		"typeof window": "object",
		__DEV__: JSON.stringify(true),
		PRODUCTION: JSON.stringify(false),
	},
	css: {
		cssModules: true, // pkgName__[local]
		lessCompile: true,
	},
	react: {
		jsxRuntime: "classic",
	},
	targets: {
		chrome: 55,
	},
	dts: false,
	sourcemap: true,

	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
