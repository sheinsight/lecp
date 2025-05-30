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
	const { a : b0 } = await import("./util");
	const { a : b1 } = await import("./util/index.js");
	const { a : b2 } = await import("./util/index.ts");

	console.log(b0, b1, b2);
})();

// ----------
import { a as c0 } from "@/util";
import { a as c1 } from "@/util/index.js";
import { a as c2 } from "@/util/index.ts";
console.log(c0, c1, c2);

(async () => {
	const { a: d0 } = await import("@/util");
	const { a: d1 } = await import("@/util/index.js");
	const { a: d2 } = await import("@/util/index.ts");

	console.log(d0, d1, d2);
})();

// swc module.resolveFully 不支持 require(省略后缀)
// const { a: a3 } = require("./util");
// console.log(a3);


//  -----------

// TODO: auto shim
import path from "node:path";
import { fileURLToPath } from "node:url";
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
console.log(_dirname, _filename);

console.log(__dirname, __filename);


console.log(import.meta.dirname);
console.log(import.meta.filename);
console.log(import.meta.url);


const { dirname, filename,url } = import.meta;
                console.log(dirname);
                console.log(filename);
				console.log(url);


// 0000
const r1  = require("./util");
const r2  = require("./util/index.js");
const r3  = require("./util/index.ts");
console.log(r1, r2, r3);
