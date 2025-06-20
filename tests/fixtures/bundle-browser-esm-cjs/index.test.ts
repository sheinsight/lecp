import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless esm and cjs for browser ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));

		// sourcemap
		expect(fileMap["index.js.map"]).toBeDefined();
		expect(fileMap["index.js"]).toContain(`//# sourceMappingURL=index.js.map`);

		// content
		await expect(fileMap["index.js"]).toMatchFileSnapshot(
			"./snapshots/es-index.js",
		);

		// css sourcemap
		expect(fileMap["index.css.map"]).toBeDefined();
		expect(fileMap["index.css"]).toContain(
			`/*# sourceMappingURL=index.css.map*/`,
		);

		// css
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).toContain("demo-component__foo");
		expect(fileMap["index.css"]).toContain("demo-component__title");
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).not.toContain(".title .foo");
		expect(fileMap["index.css"]).toContain(
			".demo-component__title .demo-component__foo",
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
			"./snapshots/lib-index.js",
		);

		// css sourcemap
		expect(fileMap["index.css.map"]).toBeDefined();
		expect(fileMap["index.css"]).toContain(
			`/*# sourceMappingURL=index.css.map*/`,
		);

		// css content
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).toContain("demo-component__foo");
		expect(fileMap["index.css"]).toContain("demo-component__title");
		expect(fileMap["index.css"]).toBeDefined();
		expect(fileMap["index.css"]).not.toContain(".title .foo");
		expect(fileMap["index.css"]).toContain(
			".demo-component__title .demo-component__foo",
		);

		// define + minify
	});
});
