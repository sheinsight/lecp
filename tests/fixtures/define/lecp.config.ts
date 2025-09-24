import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [{ type: "esm" }, { type: "cjs" }, { type: "umd", minify: false }],
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
		"typeof window": JSON.stringify("object"),
		PRODUCTION: JSON.stringify(true),
		HOST: JSON.stringify("localhost"),
	},
	dts: false,
	sourcemap: false,
	targets: {
		chrome: 55,
	},
}) as unknown;
