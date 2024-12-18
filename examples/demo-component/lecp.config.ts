import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		// swc 自动补后缀 .js
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
		cssModules: true,
		lessCompile: true,
	},
	// react: {
	// 	jsxRuntime: "classic",
	// },
	dts: true,
	targets: {
		chrome: 55,
	},
}) as unknown;
