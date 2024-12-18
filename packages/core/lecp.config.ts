import { defineConfig } from "./src/define-config.ts";

import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
	extends: "./lecp.base.config.ts",
	format: [
		{
			type: "esm",
			// builder: "swc",
			// outDir: "dist/es",
		},
		{
			type: "cjs",
			// builder: "swc",
			// outDir: "dist/lib",
			// minify: true,
		},
	],
	define: {
		"typeof window": "object",
		__DEV__: JSON.stringify(true),
		"process.env.NODE_ENV": JSON.stringify("development"),
	},
	css: {
		// [name]__[local]___[hash:base64:5]
		cssModules: `${pkg.name.replace("@", "").replace("/", "__")}__[local]`,
		lessCompile: true,
	},
	dts: {
		mode: "bundless",
		builder: "ts",
	},
	targets: {
		node: "20.11.0",
		// chrome: 55,
	},
}) as unknown;
