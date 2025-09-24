import { describe, expect, it } from "vitest";
import randomColor from "./random-color.ts";

describe("测试randomColor", () => {
	it("包颜色存在", () => {
		expect(randomColor("demo-pkg")).toBeDefined();
	});

	it("相同包的颜色输出相同", () => {
		expect(randomColor("demo-pkg")).toEqual(randomColor("demo-pkg"));
	});

	it("不同包的颜色输出不同", () => {
		expect(randomColor("demo-pkg")).not.toEqual(
			randomColor("demo-pkg2").replace("demo-pkg2", "demo-pkg"),
		);
	});

	it("颜色循环输出", () => {
		const MAX = 13;
		const pkgs = Array.from({ length: MAX + 1 }, (_, i) => `demo-pkg${i}`);
		const colors = pkgs.map(randomColor).map(i => i.slice(0, 9)); // '\x1B[34m\x1B[1m',
		expect(new Set(colors).size).toBeLessThan(pkgs.length);
	});
});
