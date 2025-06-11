import { defineConfig } from "./src/define-config.ts";

export default defineConfig({
	format: [{ type: "esm" }],
	// dts: true,
	dts: { mode: "bundless", builder: "swc" },
	targets: {
		node: "20.19.0",
	},
}) as unknown;
