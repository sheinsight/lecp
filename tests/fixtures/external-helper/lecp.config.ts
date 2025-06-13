import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	shims: true,
	dts: false,
	sourcemap: false,
	targets: {
		chrome: "40",
	},
	externalHelpers: true,
}) as unknown;
