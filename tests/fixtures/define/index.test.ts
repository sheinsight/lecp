import { expect, describe, it, beforeAll } from "vitest";
import path from "node:path";
import { runBuild, getOutputMap } from "../../util";

describe("bundless define ok", async () => {
	beforeAll(async () => {
		runBuild({ cwd: import.meta.dirname });
	});

	it("esm define ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain('"production"');
		expect(content).not.toContain("process.env.NODE_ENV");
		expect(content).toContain("true");
		expect(content).not.toContain("PRODUCTION");
		expect(content).toContain('"object"');
		expect(content).not.toContain("typeof window");
	});

	it("cjs define ok", async () => {
		const cjsFileMap = await getOutputMap(
			path.join(import.meta.dirname, "lib"),
		);
		let content = cjsFileMap["index.js"];
		expect(content).toContain('"production"');
		expect(content).not.toContain("process.env.NODE_ENV");
		expect(content).toContain("true");
		expect(content).not.toContain("PRODUCTION");
		expect(content).toContain('"object"');
		expect(content).not.toContain("typeof window");
	});
});
