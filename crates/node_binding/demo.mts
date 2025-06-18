// ------------------------------------------------------
import path from "path";
import { bundlessFilesAsync } from "./index.js";

(async () => {
	performance.mark("start");
	try {
		// 切换 cwd 到 examples/demo-component
		console.log("cwd", process.cwd());
		const cwd = path.resolve(process.cwd(), "../../examples/demo-component");
		const options = {
			// config
			isModule: true,
			cwd,
			exclude: [],
			// -------
			format: "esm",
			targets: {
				chrome: "55",
				// node: "20.11.0",
			},
			define: {
				PRODUCTION: '"true"',
				VERSION: '"5fa3b9"',
				BROWSER_SUPPORTS_HTML5: '"true"',
				"typeof window": '"object"',
				"process.env.NODE_ENV": '"production"',
			},
			shims: {
				legacy: true,
			},
			sourceMap: true,
			minify: false,
			react: {
				jsxRuntime: "automatic",
			},
			css: {
				cssModules: "demo-component__[name]_[local]",
				lessCompile: true,
			},
			alias: {
				"@": "./src",
			},
		};

		await bundlessFilesAsync(Buffer.from(JSON.stringify(options)));

		console.log("bundlessFilesAsync success");
	} catch (error) {
		console.log("bundlessFilesAsync error");
		console.log(error);
	} finally {
		performance.mark("end");
	}

	const measure = performance.measure("bundlessFilesAsync", "start", "end");
	console.log("bundlessJsAsync measure", measure.duration);
})();
