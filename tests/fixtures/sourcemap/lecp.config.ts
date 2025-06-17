import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	dts: false,
	sourcemap: true,
	targets: {
		chrome: 55,
	},
	css: {
		lessCompile: true,
	},
}) as unknown;
