import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }],
	dts: false,
	sourcemap: false,
	targets: {
		chrome: 55,
	},
	react: {
		jsxRuntime: "classic",
	},
	css: {
		cssModules: true,
	},
}) as unknown;
