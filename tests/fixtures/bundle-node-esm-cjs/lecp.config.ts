import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		{
			mode: "bundle",
			type: "esm",
		},
		{
			mode: "bundle",
			type: "cjs",
		},
	],
	define: {
		__DEV__: JSON.stringify(true),
		PRODUCTION: JSON.stringify(false),
	},

	targets: {
		node: "22.16.0",
	},
	dts: false,
	sourcemap: true,

	// from tsconfig.json ??
	alias: {
		"@": "./src",
	},
}) as unknown;
