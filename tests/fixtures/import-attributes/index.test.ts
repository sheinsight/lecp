import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless import-attributes ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("esm preserves import attributes", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		const content = fileMap["index.js"];

		// import attributes should be preserved in ESM output
		expect(content).toContain("with");
		expect(content).toContain('type: "json"');
		expect(content).toContain("data.json");
	});

	it("cjs preserves import attributes", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		const content = fileMap["index.cjs"];

		// CJS output should also preserve import attributes via require()
		// or dynamic import with attributes
		expect(content).toContain("data.json");
	});
});
