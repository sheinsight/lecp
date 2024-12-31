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
	dts: true,
	shims: true,
	targets: {
		node: "20.11.0",
	},
	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
