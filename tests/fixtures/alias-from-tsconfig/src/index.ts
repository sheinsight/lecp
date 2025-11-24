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

// 如果涉及到修改后缀, 暂不支持 @@/read-pkg 这种形式的别名，需要指定到具体文件
import readPkg, { readPackageSync } from "@@/read-pkg/index.js";

console.log(readPkg, readPackageSync);
