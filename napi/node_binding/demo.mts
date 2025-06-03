// ------------------------------------------------------
import path from "path";
import { bundlessJsAsync } from "./index.js";

(async () => {
	performance.mark("start");
	try {
		// 切换 cwd 到 examples/demo-component
		console.log("cwd", process.cwd());
		const cwd = path.resolve(process.cwd(), "../../examples/demo-component");
		const options = {
			"isModule": true,
			format: "esm",
			cwd,
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
			exclude: [],
		};

		await bundlessJsAsync(cwd, Buffer.from(JSON.stringify(options)));

		console.log("bundlessJsAsync success");
	} catch (error) {
		console.log("bundlessJsAsync error");
		console.log(error);
	} finally {
		performance.mark("end");
	}

	const measure = performance.measure("bundlessJsAsync", "start", "end");
	console.log("bundlessJsAsync measure", measure.duration);
})();
