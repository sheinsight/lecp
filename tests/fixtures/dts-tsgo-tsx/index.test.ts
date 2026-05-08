import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless dts(tsgo) tsx ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm dts ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// tsx -> d.ts content
		expect(fileMap["index.d.ts"]).toContain(
			`export { a } from "./util/index.js";`,
		);
		expect(fileMap["util/index.d.ts"]).toContain("export declare const a = 1;");

		// sourcemap references tsx source
		expect(fileMap["util/index.d.ts.map"]).toContain(
			`"../../src/util/index.tsx"`,
		);
		expect(fileMap["util/index.d.ts.map"]).toContain(`"file":"index.d.ts"`);

		// copy global.d.ts
		expect(fileMap["global.d.ts"]).toBeDefined();
	});

	it("bundless cjs dts ok(.cts)", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));

		// tsx -> d.cts content
		expect(fileMap["index.d.cts"]).toContain(
			`export { a } from "./util/index.cjs";`,
		);
		expect(fileMap["util/index.d.cts"]).toContain(
			"export declare const a = 1;",
		);

		// sourcemap references tsx source
		expect(fileMap["util/index.d.cts.map"]).toContain(
			`"../../src/util/index.tsx"`,
		);
		expect(fileMap["util/index.d.cts.map"]).toContain(`"file":"index.d.cts"`);
	});
});
