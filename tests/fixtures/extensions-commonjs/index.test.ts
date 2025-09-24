import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless file extension ok(type:commonjs)", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm file extension ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		expect(fileMap["index.mjs"]).toBeDefined();
		expect(fileMap["index.mjs"]).toContain(`"./util/index.mjs"`);
		expect(fileMap["index.js"]).not.toBeDefined();
	});

	it("bundless cjs file extension ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		expect(fileMap["index.js"]).toBeDefined();
		expect(fileMap["index.js"]).toContain(`"./util/index.js"`);
		expect(fileMap["index.cjs"]).not.toBeDefined();
	});
});
