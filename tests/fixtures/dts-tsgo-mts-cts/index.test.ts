import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless dts(tsgo) mts/cts ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("esm dts from .mts and .cts sources", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// .mts source -> d.ts
		expect(fileMap["util/esm-util.d.ts"]).toContain(
			"export declare const a = 1;",
		);

		// .cts source -> d.ts
		expect(fileMap["util/cjs-util.d.ts"]).toContain(
			"export declare const b = 2;",
		);

		// index re-exports with correct extensions
		expect(fileMap["index.d.ts"]).toContain("esm-util");
		expect(fileMap["index.d.ts"]).toContain("cjs-util");
	});

	it("cjs dts from .mts and .cts sources", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// .mts source -> d.cts
		expect(fileMap["util/esm-util.d.cts"]).toContain(
			"export declare const a = 1;",
		);

		// .cts source -> d.cts
		expect(fileMap["util/cjs-util.d.cts"]).toContain(
			"export declare const b = 2;",
		);

		// index re-exports with correct extensions
		expect(fileMap["index.d.cts"]).toContain("esm-util");
		expect(fileMap["index.d.cts"]).toContain("cjs-util");
	});
});
