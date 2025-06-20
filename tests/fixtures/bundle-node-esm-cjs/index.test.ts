import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless esm and cjs for node ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// sourcemap
		expect(fileMap["index.mjs.map"]).toBeDefined();
		expect(fileMap["index.mjs"]).toContain(
			`//# sourceMappingURL=index.mjs.map`,
		);

		// content
		await expect(fileMap["index.mjs"]).toMatchFileSnapshot(
			"./snapshots/es/index.mjs",
		);

		// define
	});

	it("bundless cjs ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// source map
		expect(fileMap["index.js.map"]).toBeDefined();
		expect(fileMap["index.js"]).toContain(`//# sourceMappingURL=index.js.map`);

		// content
		await expect(fileMap["index.js"]).toMatchFileSnapshot(
			"./snapshots/lib/index.js",
		);
		// define + minify
	});
});
