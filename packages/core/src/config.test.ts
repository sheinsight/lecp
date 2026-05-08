import { describe, expect, it } from "vitest";
import type { SystemConfig } from "./build.ts";
import { getFinalUserOptions } from "./config.ts";

const mockSystemConfig: SystemConfig = {
	cwd: "/mock",
	watch: false,
	logLevel: "info",
	pkg: {
		name: "mock-pkg",
		version: "1.0.0",
		dependencies: {},
		devDependencies: {},
		peerDependencies: {},
		optionalDependencies: {},
		_id: "",
	} as SystemConfig["pkg"],
};

const baseUserConfig = {
	format: [{ type: "esm" as const }],
};

describe("getFinalUserOptions - css.lessCompile 默认值", () => {
	it("未配置 css 时，lessCompile 默认为 true", () => {
		const result = getFinalUserOptions(baseUserConfig, mockSystemConfig);
		expect(result.css?.lessCompile).toBe(true);
	});

	it("配置了 css 但未设置 lessCompile 时，lessCompile 默认为 true", () => {
		const result = getFinalUserOptions(
			{ ...baseUserConfig, css: { cssModules: true } },
			mockSystemConfig,
		);
		expect(result.css?.lessCompile).toBe(true);
	});

	it("显式设置 lessCompile 为 false 时，覆盖默认值", () => {
		const result = getFinalUserOptions(
			{ ...baseUserConfig, css: { lessCompile: false } },
			mockSystemConfig,
		);
		expect(result.css?.lessCompile).toBe(false);
	});

	it("同时配置 cssModules 和 lessCompile 时，两者均生效", () => {
		const result = getFinalUserOptions(
			{ ...baseUserConfig, css: { cssModules: true, lessCompile: false } },
			mockSystemConfig,
		);
		expect(result.css?.lessCompile).toBe(false);
		expect(result.css?.cssModules).toBeTruthy();
	});
});
