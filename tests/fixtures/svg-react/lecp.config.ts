import { defineConfig } from "@shined/lecp";

export default defineConfig({
	format: [
		{
			type: "umd",
			externals: {
				react: "React",
				"react-dom": "ReactDOM",
			},
			minify: false,
		},
	],
	targets: {
		chrome: "55",
	},
	dts: false,
});
