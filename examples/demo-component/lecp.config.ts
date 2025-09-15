import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		// swc 自动补后缀 .js
		// {
		// 	type: "umd",
		// 	extraCompile: ["immer"],
		// },
		{
			type: "esm",
		},
	],
	define: {
		"typeof window": "object",
		__DEV__: JSON.stringify(true),
		"process.env.NODE_ENV": JSON.stringify("development"),
	},
	css: {
		// [name]__[local]___[hash:base64:5]
		cssModules: true, // pkgName__[local]
		lessCompile: true,
	},
	react: {
		// jsxRuntime: "preserve", // "classic" | "automatic" | "preserve"
	},
	// dts: { builder: "ts", mode: "bundless" },
	dts: { mode: "bundless", builder: "swc" },
	targets: {
		chrome: 55,
	},

	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
