import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless define ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm define ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain('"production"');
		expect(content).not.toContain("process.env.NODE_ENV");
		expect(content).toContain("true");
		expect(content).not.toContain("PRODUCTION");
		expect(content).toContain('"object"');
		expect(content).not.toContain("typeof window");
		expect(content).toContain('"localhost"');
		expect(content).not.toContain("HOST");
	});

	it("bundless cjs define ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).toContain('"production"');
		expect(content).not.toContain("process.env.NODE_ENV");
		expect(content).toContain("true");
		expect(content).not.toContain("PRODUCTION");
		expect(content).toContain('"object"');
		expect(content).not.toContain("typeof window");
		expect(content).toContain('"localhost"');
		expect(content).not.toContain("HOST");
	});

	it("bundle umd define ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "umd"));
		let content = fileMap["index.js"];
		expect(content).toContain('"production"');
		expect(content).not.toContain("process.env.NODE_ENV");
		expect(content).toContain("true");
		expect(content).not.toContain("PRODUCTION");
		expect(content).toContain('"object"');
		expect(content).not.toContain("typeof window");
		expect(content).toContain('"localhost"');
		expect(content).not.toContain("HOST");
	});

	// TODO: minify 后会删除部分代码
});
