// ------------------------------------------------------
import path from "path";
import { asyncTaskReadFile, readFileAsync, sum, sumAsync,bundlessJsAsync } from "./index.js";

const a = sum(1, 2);
console.log(a); // 3

sumAsync(1, 2)
	.then(result => {
		console.log(result); // 3
	})
	.catch(error => {
		console.error(error);
	});

readFileAsync("demo.mts")
	.then(data => {
		console.log("content", data.toString());
	})
	.catch(error => {
		console.error(error);
	});

asyncTaskReadFile("demo.mts")
	.then(data => {
		console.log("content", data.toString());
	})
	.catch(error => {
		console.error(error);
	});

(async () => {

	performance.mark("start");
	try {
		// 切换 cwd 到 examples/demo-component
		console.log("cwd", process.cwd());
		const cwd = path.resolve(process.cwd(),"../../examples/demo-component");
		await bundlessJsAsync(cwd);
		performance.mark("end");
		console.log("bundlessJsAsync success");
	} catch (error) {
		console.log("bundlessJsAsync error", error);

	}

	const measure = performance.measure("bundlessJsAsync", "start", "end");
	console.log("bundlessJsAsync measure", measure.duration);


})()
