import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless css ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm css ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("index.css");
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).toContain(".title .foo");
	});

	it("bundless cjs css ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).toContain("index.css");
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).toContain(".title .foo");
	});
});
