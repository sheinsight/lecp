import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless dts(tsgo) sourcemap ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("esm d.ts.map file and sourceMappingURL", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// d.ts contains correct sourceMappingURL
		expect(fileMap["index.d.ts"]).toContain(
			"//# sourceMappingURL=index.d.ts.map",
		);
		expect(fileMap["util/index.d.ts"]).toContain(
			"//# sourceMappingURL=index.d.ts.map",
		);

		// d.ts.map exists and has correct file field
		const indexMap = JSON.parse(fileMap["index.d.ts.map"]);
		expect(indexMap.file).toBe("index.d.ts");

		const utilMap = JSON.parse(fileMap["util/index.d.ts.map"]);
		expect(utilMap.file).toBe("index.d.ts");
	});

	it("cjs d.cts.map file and sourceMappingURL", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// d.cts contains correct sourceMappingURL
		expect(fileMap["index.d.cts"]).toContain(
			"//# sourceMappingURL=index.d.cts.map",
		);
		expect(fileMap["util/index.d.cts"]).toContain(
			"//# sourceMappingURL=index.d.cts.map",
		);

		// d.cts.map exists and has correct file field
		const indexMap = JSON.parse(fileMap["index.d.cts.map"]);
		expect(indexMap.file).toBe("index.d.cts");

		const utilMap = JSON.parse(fileMap["util/index.d.cts.map"]);
		expect(utilMap.file).toBe("index.d.cts");
	});
});
