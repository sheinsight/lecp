import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		// {
		// 	type: "cjs",
		// 	exclude: ["**/client/**/*.*"],
		// 	dts: true,
		// 	targets: {
		// 		node: "20.18.0",
		// 	},
		// },
		{
			type: "cjs",
			outDir: "lib/server",
			entry: "src/server",
			dts: true,
			targets: {
				node: "20.18.0",
			},
		},

		{
			type: "esm",
			outDir: "lib/client",
			entry: "src/client",
			dts: true,
			targets: {
				chrome: 70,
			},
		},
	],
}) as unknown;
