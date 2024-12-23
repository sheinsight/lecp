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
	targets: {
		node: "20.11.0",
	},
}) as unknown;
