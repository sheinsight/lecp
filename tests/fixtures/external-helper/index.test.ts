import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless externalHelper ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("node esm externalHelper ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("@swc/helpers/");
		expect(content).not.toContain("async function");
	});

	it("node cjs externalHelper ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).toContain("@swc/helpers/");
		expect(content).not.toContain("async function");
	});

	// TODO: swc.module.ignoreDynamic, import("@/util") 不转换
});
