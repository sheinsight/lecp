import { defineConfig } from "./src/define-config.ts";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }],
	// dts: true,
	dts: { mode: "bundless", builder: "ts" },
	targets: {
		node: "20.11.0",
	},
}) as unknown;
