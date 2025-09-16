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
	react: {
		runtime: "classic", // 规避 test 文件夹 无需安装 react
	},
	targets: {
		chrome: "55",
	},
	dts: false,
});
