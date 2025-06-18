import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless dts(swc isolatedDeclarations alias) ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm dts ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// content
		expect(fileMap["index.d.ts"]).toContain(
			`export { a } from "./util/index.js";`,
		);
		expect(fileMap["index.d.ts"]).not.toContain(`@/util`);

		expect(fileMap["util/index.d.ts"]).toContain("export declare const a = 1;");

		// sourcemap(swc 不支持生成 d.ts 的 sourcemap)
		// expect(fileMap["index.d.ts.map"]).toContain("../src/index.ts");
		// expect(fileMap["index.d.ts"]).toContain(
		// 	"//# sourceMappingURL=index.d.ts.map",
		// );
		// expect(fileMap["util/index.d.ts.map"]).toContain("../../src/util/index.ts");
		// expect(fileMap["util/index.d.ts"]).toContain(
		// 	"//# sourceMappingURL=index.d.ts.map",
		// );
	});

	it("bundless cjs dts ok(.cjs)", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// content
		expect(fileMap["index.d.ts"]).toContain(
			`export { a } from "./util/index.js";`,
		);
		expect(fileMap["index.d.ts"]).not.toContain(`@/util`);
		expect(fileMap["util/index.d.ts"]).toContain("export declare const a = 1;");

		// sourcemap(swc 不支持生成 d.ts 的 sourcemap)
		// expect(fileMap["index.d.ts.map"]).toContain("../src/index.ts");
		// expect(fileMap["index.d.ts"]).toContain(
		// 	"//# sourceMappingURL=index.d.ts.map",
		// );
		// expect(fileMap["util/index.d.ts.map"]).toContain("../../src/util/index.ts");
		// expect(fileMap["util/index.d.ts"]).toContain(
		// 	"//# sourceMappingURL=index.d.ts.map",
		// );
	});
});
