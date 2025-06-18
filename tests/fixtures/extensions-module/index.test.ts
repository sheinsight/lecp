import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless file extension ok(type:module)", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm file extension ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		expect(fileMap["index.js"]).toBeDefined();
		expect(fileMap["index.js"]).toContain(`"./util/index.js"`);
		expect(fileMap["index.cjs"]).not.toBeDefined();
	});

	it("bundless cjs file extension ok(.cjs)", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		expect(fileMap["index.cjs"]).toBeDefined();
		expect(fileMap["index.cjs"]).toContain(`"./util/index.cjs"`);
		expect(fileMap["index.js"]).not.toBeDefined();
	});
});
