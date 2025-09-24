import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	shims: false,
	dts: {
		builder: "ts",
		mode: "bundless",
	},
	sourcemap: false,
	targets: {
		node: "20.11.0",
		// chrome: "55",
	},
}) as unknown;
