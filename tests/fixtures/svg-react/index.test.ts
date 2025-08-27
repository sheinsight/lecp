import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("svg with ?react query should transform to React component", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("umd build should handle SVG imports", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "umd"));
		let content = fileMap["index.js"];

		// Should contain React externalization
		expect(content).toContain("ReactComponent");

		// Should contain base64 encoded SVG for regular import
		expect(content).toContain("data:image/svg+xml;base64");
	});
});
