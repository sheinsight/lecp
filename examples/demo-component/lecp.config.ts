import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		// swc 自动补后缀 .js
		{
			type: "umd",
		},
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
	// react: {
	// 	jsxRuntime: "classic",
	// },
	// dts: { builder: "ts", mode: "bundless" },
	targets: {
		chrome: 55,
	},
}) as unknown;
