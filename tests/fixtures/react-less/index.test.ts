import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless less ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm less ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).not.toContain("index.less");
		expect(content).toContain("index.css");
		expect(fileMap["index.css"]).toBeDefined();
	});

	it("bundless cjs less ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).not.toContain("index.less");
		expect(content).toContain("index.css");
		expect(fileMap["index.css"]).toBeDefined();
	});
});
