import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	dts: false,
	sourcemap: false,
	targets: {
		chrome: 55,
	},
	react: {
		jsxRuntime: "automatic", // "classic" | "automatic" | "preserve"
	},
}) as unknown;
