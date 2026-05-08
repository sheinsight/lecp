import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless dts(tsgo) no declarationMap", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("esm d.ts has no sourceMappingURL and no .map file", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		expect(fileMap["index.d.ts"]).toBeDefined();
		expect(fileMap["index.d.ts"]).not.toContain("sourceMappingURL");
		expect(fileMap["index.d.ts.map"]).toBeUndefined();

		expect(fileMap["util/index.d.ts"]).toBeDefined();
		expect(fileMap["util/index.d.ts"]).not.toContain("sourceMappingURL");
		expect(fileMap["util/index.d.ts.map"]).toBeUndefined();
	});

	it("cjs d.cts has no sourceMappingURL and no .map file", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		expect(fileMap["index.d.cts"]).toBeDefined();
		expect(fileMap["index.d.cts"]).not.toContain("sourceMappingURL");
		expect(fileMap["index.d.cts.map"]).toBeUndefined();

		expect(fileMap["util/index.d.cts"]).toBeDefined();
		expect(fileMap["util/index.d.cts"]).not.toContain("sourceMappingURL");
		expect(fileMap["util/index.d.cts.map"]).toBeUndefined();
	});
});
