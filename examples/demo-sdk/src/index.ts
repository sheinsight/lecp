import { a as a4 } from "@/util";
import { a as a5 } from "@/util/index.js";
import { a as a6 } from "@/util/index.ts"; // 不支持转换 index.js, 二次编译支持
import { a } from "./util";
import { a as a2 } from "./util/index.js";
import { a as a3 } from "./util/index.ts"; // 默认不支持, 插件转成 .js

import type { TypeA } from "@/util/index.ts"; // ts: typescript-transform-paths 支持, swc 本身支持 paths
export type { TypeA };

console.log(a, a2, a3, a4, a5, a6);

(async () => {
	const { a } = await import("./util");
	const { a: a2 } = await import("./util/index.js");
	const { a: a3 } = await import("./util/index.ts"); // 默认不支持, 插件转成 .js
	const { a: a4 } = await import("@/util");
	const { a: a5 } = await import("@/util/index.js");
	const { a: a6 } = await import("@/util/index.ts"); // 不支持转换 index.js, 二次编译支持

	console.log(a, a2, a3, a4, a5, a6);
})();

// swc module.resolveFully 不支持 require(省略后缀)
// const { a: a3 } = require("./util");
// console.log(a3);

// import path from "node:path";
// import { fileURLToPath } from "node:url";
// const _filename = fileURLToPath(import.meta.url);
// const _dirname = path.dirname(_filename);
// console.log(_dirname, _filename);

// esm support __dirname, __filename
console.log(__dirname, __filename);

// cjs support import.meta
console.log(import.meta.dirname, import.meta.filename, import.meta.url);

const { dirname, filename, url } = import.meta;
console.log(dirname, filename, url);

const { dirname: d1, filename: f1, url: u1 } = import.meta;
console.log(d1, f1, u1);
