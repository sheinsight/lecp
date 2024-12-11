import { defineConfig } from "./src/define-config.ts";

export default defineConfig({
	extends: "./lecp.base.config.ts",
	format: [
		{
			type: "esm",
			builder: "swc",
		},
	],
	define: {
		"typeof window": "object",
		__DEV__: JSON.stringify(true),
		"process.env.NODE_ENV": JSON.stringify("development"),
	},
	css: {
		// [name]__[local]___[hash:base64:5]
		cssModules: "[name]__[local]",
		lessCompile: true,
	},
	dts: {
		mode: "bundless",
		builder: "ts",
	},
}) as unknown;
