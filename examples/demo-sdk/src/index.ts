// const dir = process.env.DIR_READ_FROM_RUNTIME;

// const resolve1 = require.resolve(dir!);

// const resolve2 = require.resolve("./other.js");

// const resolve3 = require.resolve("./foo/" + dir + ".js");

// const resolve4 = require.resolve(
// 	process.env.RANDOM ? "./foo/" + dir + ".js" : "./bar/" + dir + "js",
// );

// __dirname;
// __filename;

// console.log(resolve1, resolve2, resolve3, resolve4);



import { a } from "./util";
import { a as a1 } from "./util/index.js";
import { a as a2 } from "./util/index.ts";

console.log(a, a1, a2);

(async () => {
	const { a: a3 } = await import("./util");
	const { a: a4 } = await import("./util/index.ts");

	console.log(a3, a4);
})();

// swc module.resolveFully 不支持 require(省略后缀)
// const { a: a3 } = require("./util");
// console.log(a3);

// TODO: auto shim
import path from "node:path";
import { fileURLToPath } from "node:url";
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

console.log(_dirname, _filename);



console.log(__dirname, __filename);



import { a as a5 } from "@/util";
import { a as a6 } from "@/util/index.ts";
console.log(a5,a6);
