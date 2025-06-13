import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getOutputMap, runBuild } from "../../util";

describe("bundless jsx-runtime automatic ok", async () => {
	beforeAll(async () => {
		await runBuild({ cwd: import.meta.dirname });
	});

	it("bundless esm jsx-runtime automatic ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "es"));
		let content = fileMap["index.js"];
		expect(content).toContain("react/jsx-runtime");
		expect(content).not.toContain("React.createElement");
	});

	it("bundless cjs jsx-runtime automatic ok", async () => {
		const fileMap = await getOutputMap(path.join(import.meta.dirname, "lib"));
		let content = fileMap["index.js"];
		expect(content).toContain("react/jsx-runtime");
		expect(content).not.toContain("React.createElement");
	});
});
