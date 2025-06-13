import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless alias ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("node esm alias ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("./util/index.js");
		expect(content).not.toContain("@/util");
		expect(content).not.toContain("util/index.ts");
	});

	it("node cjs alias ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.cjs"];
		expect(content).toContain("./util/index.js");
		expect(content).not.toContain("@/util");
		expect(content).not.toContain("util/index.ts");
	});

	// TODO: swc.module.ignoreDynamic, import("@/util") 不转换
});
