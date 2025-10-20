import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless shims ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("esm shims ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("import.meta.filename");
		expect(content).not.toContain("__filename");
		expect(content).toContain("import.meta.dirname");
		expect(content).not.toContain("__dirname");
		expect(content).toContain("import.meta.url");
		expect(content).toContain("_require");
		expect(content).toContain("createRequire");
	});

	it("cjs shims ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.cjs"];
		expect(content).not.toContain("import.meta.filename");
		expect(content).toContain("__filename");
		expect(content).not.toContain("import.meta.dirname");
		expect(content).toContain("__dirname");
		expect(content).not.toContain("import.meta.url");
	});
});
