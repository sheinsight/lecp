import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	shims: false,
	dts: {
		builder: "tsgo",
		mode: "bundless",
	},
	targets: {
		node: "20.11.0",
	},
}) as unknown;
