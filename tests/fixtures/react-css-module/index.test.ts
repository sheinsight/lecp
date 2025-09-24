import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless css module ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm css module ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("index.css");
		expect(content).toContain("css-module-test__foo");
		expect(content).toContain("css-module-test__title");
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).not.toContain(".title .foo");
		expect(fileMap["index.css"]).toContain(
			".css-module-test__title .css-module-test__foo",
		);
	});

	// it("bundless cjs css ok", async () => {
	// 	const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
	// 	let content = fileMap["index.js"];
	// 	expect(content).toContain("index.css");
	// 	expect(fileMap["index.css"]).toBeDefined();
	// 	expect(fileMap["index.css"]).toContain(".title .foo");
	// });
});
