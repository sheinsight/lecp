import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	dts: false,
	sourcemap: false,
	targets: {
		node: "22",
	},
}) as unknown;
