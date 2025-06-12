import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	shims: true,
	dts: false,
	sourcemap: false,
	targets: {
		node: "20.11.0",
		// chrome: "55",
	},
}) as unknown;
