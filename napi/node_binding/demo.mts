// ------------------------------------------------------
import { sum, sumAsync, readFileAsync, asyncTaskReadFile } from "./index.js";

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
