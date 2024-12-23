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
