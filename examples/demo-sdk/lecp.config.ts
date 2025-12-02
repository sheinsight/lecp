import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		{
			type: "cjs",
			// swcOptions: {
			// 	module: {
			// 		type: "commonjs",
			// 		ignoreDynamic: true,
			// 	},
			// },
		},
		{
			type: "esm",
		},
	],
	// dts: { builder: "ts", mode: "bundless" },
	shims: true,
	// shims: {
	// 	legacy: true,
	// },
	targets: {
		node: "20.11.0",
	},
	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
