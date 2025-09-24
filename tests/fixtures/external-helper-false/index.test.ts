import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless externalHelper false ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("node esm externalHelper false ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).not.toContain("@swc/helpers/");
		expect(content).not.toContain("async function");
		expect(content).toContain("function _async_to_generator");
	});

	it("node cjs externalHelper false ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).not.toContain("@swc/helpers/");
		expect(content).not.toContain("async function");
		expect(content).toContain("function _async_to_generator");
	});

	// TODO: swc.module.ignoreDynamic, import("@/util") 不转换
});
