import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless entry ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless entry ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// client import() 正确保留
		expect(fileMap["client/index.js"]).toContain(`await import("./b.js");`);
		expect(fileMap["client/index.js"]).not.toContain(`require`);

		// server import() 默认被转换
		expect(fileMap["server/index.js"]).toContain(`require("./b.js")`);
		expect(fileMap["server/index.js"]).not.toContain(`import`);

		// expect(fileMap["index.js"]).toContain(`require("./server`);
		// expect(fileMap["index.js"]).not.toContain(`import`);

		expect(fileMap["index.js"]).toBeUndefined();
		expect(fileMap["index.d.ts"]).toBeUndefined();

		// content
		// expect(fileMap["index.d.ts"]).toContain(
		// 	`export * from "./server/index.js";`,
		// );
		expect(fileMap["server/index.d.ts"]).toContain(
			"export declare const a: () => Promise<void>;",
		);
		expect(fileMap["client/index.d.ts"]).toContain(
			"export declare const a: () => Promise<void>;",
		);
	});
});
