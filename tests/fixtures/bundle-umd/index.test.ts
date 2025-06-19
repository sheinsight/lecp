import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless umd ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless umd ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "umd"));

		// sourcemap
		expect(fileMap["index.js.map"]).toBeDefined();
		expect(fileMap["index.js"]).toContain(`//# sourceMappingURL=index.js.map`);

		// content
		expect(fileMap["index.js"]).toContain(`root["DemoComponent"]`);
		await expect(fileMap["index.js"]).toMatchFileSnapshot(
			"./snapshot/index.js",
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

	it("bundless umd min ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "umd"));

		// source map
		expect(fileMap["index.min.js.map"]).toBeDefined();
		expect(fileMap["index.min.js"]).toContain(
			`//# sourceMappingURL=index.min.js.map`,
		);

		// content
		expect(fileMap["index.min.js"]).toContain(`.DemoComponent`);
		await expect(fileMap["index.min.js"]).toMatchFileSnapshot(
			"./snapshot/index.min.js",
		);

		// css sourcemap
		expect(fileMap["index.min.css.map"]).toBeDefined();
		expect(fileMap["index.min.css"]).toContain(
			`/*# sourceMappingURL=index.min.css.map*/`,
		);

		// css content
		expect(fileMap["index.min.css"]).toBeDefined();
		expect(fileMap["index.min.css"]).toContain("demo-component__foo");
		expect(fileMap["index.min.css"]).toContain("demo-component__title");
		expect(fileMap["index.min.css"]).toBeDefined();
		expect(fileMap["index.min.css"]).not.toContain(".title .foo");
		expect(fileMap["index.min.css"]).toContain(
			".demo-component__title .demo-component__foo",
		);

		// define + minify
	});
});
