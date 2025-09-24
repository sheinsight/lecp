import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless sourcemap ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm sourcemap ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		expect(fileMap["index.js.map"]).toContain(`"../src/index.ts"`);
		expect(fileMap["index.js"]).toContain("//# sourceMappingURL=index.js.map");
		expect(fileMap["util/index.js.map"]).toContain(`"../../src/util/index.ts"`);
		expect(fileMap["util/index.js"]).toContain(
			"//# sourceMappingURL=index.js.map",
		);
	});

	it("bundless cjs sourcemap ok(.cjs)", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		expect(fileMap["index.cjs.map"]).toContain(`"../src/index.ts"`);
		expect(fileMap["index.cjs"]).toContain(
			"//# sourceMappingURL=index.cjs.map",
		);
		expect(fileMap["util/index.cjs.map"]).toContain(
			`"../../src/util/index.ts"`,
		);
		expect(fileMap["util/index.cjs"]).toContain(
			"//# sourceMappingURL=index.cjs.map",
		);
	});
});
