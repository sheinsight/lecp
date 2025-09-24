import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless sourcemap ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm sourcemap ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		expect(fileMap["index.js.map"]).toContain(`"../src/index.tsx"`);
		expect(fileMap["index.js"]).toContain("//# sourceMappingURL=index.js.map");
		expect(fileMap["index.css.map"]).toContain(`"../src/index.less"`);
		expect(fileMap["index.css"]).toContain(
			"/*# sourceMappingURL=index.css.map*/",
		);
		expect(fileMap["util/index.js.map"]).toContain(`"../../src/util/index.ts"`);
		expect(fileMap["util/index.js"]).toContain(
			"//# sourceMappingURL=index.js.map",
		);
	});

	it("bundless cjs sourcemap ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		expect(fileMap["index.js.map"]).toContain(`"../src/index.tsx"`);
		expect(fileMap["index.js"]).toContain("//# sourceMappingURL=index.js.map");
		expect(fileMap["index.css.map"]).toContain(`"../src/index.less"`);
		expect(fileMap["index.css"]).toContain(
			"/*# sourceMappingURL=index.css.map*/",
		);
		expect(fileMap["util/index.js.map"]).toContain(`"../../src/util/index.ts"`);
		expect(fileMap["util/index.js"]).toContain(
			"//# sourceMappingURL=index.js.map",
		);
	});
});
