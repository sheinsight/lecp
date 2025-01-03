import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		{
			type: "cjs",
		},
		{
			type: "esm",
		},
	],
	// dts: { builder: "ts", mode: "bundless" },
	shims: true,
	targets: {
		node: "20.11.0",
	},
	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
