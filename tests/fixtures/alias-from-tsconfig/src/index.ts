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
