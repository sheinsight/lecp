import ts from "typescript";
import { describe, expect, it } from "vitest";
import { createDtsHidingSystem } from "./index.ts";

const OUT_DIR = "/project/es";

const createMockSys = (
	overrides: Partial<ts.System> = {},
): { sys: ts.System; calls: string[] } => {
	const calls: string[] = [];
	const sys = {
		...ts.sys,
		useCaseSensitiveFileNames: true,
		fileExists: (fileName: string) => {
			calls.push(`fileExists:${fileName}`);
			return true;
		},
		readFile: (fileName: string) => {
			calls.push(`readFile:${fileName}`);
			return "content";
		},
		readDirectory: () => [
			"/project/src/index.ts",
			"/project/es/index.d.ts",
			"/project/es/index.d.ts.map",
			"/project/es/index.js",
		],
		...overrides,
	} satisfies ts.System;
	return { sys, calls };
};

describe("createDtsHidingSystem", () => {
	describe("隐藏 outDir 下的声明文件", () => {
		const { sys } = createMockSys();
		const system = createDtsHidingSystem(OUT_DIR, sys);

		it.each([
			"/project/es/index.d.ts",
			"/project/es/index.d.cts",
			"/project/es/index.d.mts",
			"/project/es/index.d.ts.map",
			"/project/es/nested/dir/types.d.ts",
		])("fileExists(%s) -> false", fileName => {
			expect(system.fileExists(fileName)).toBe(false);
		});

		it.each(["/project/es/index.d.ts", "/project/es/index.d.cts.map"])(
			"readFile(%s) -> undefined",
			fileName => {
				expect(system.readFile(fileName)).toBeUndefined();
			},
		);

		it("readDirectory 过滤产物声明文件", () => {
			expect(system.readDirectory("/project", [".ts"])).toEqual([
				"/project/src/index.ts",
				"/project/es/index.js",
			]);
		});
	});

	describe("不影响其他文件", () => {
		const { sys, calls } = createMockSys();
		const system = createDtsHidingSystem(OUT_DIR, sys);

		it.each([
			// 源码
			"/project/src/index.ts",
			// 源码中的手写声明
			"/project/src/global.d.ts",
			// outDir 下的非声明文件
			"/project/es/index.js",
			"/project/es/index.js.map",
			// 前缀相似但不同的目录 (es vs es-extra)
			"/project/es-extra/index.d.ts",
			// 其他包的产物声明 (monorepo 兄弟包)
			"/project/node_modules/@scope/pkg/es/index.d.ts",
		])("fileExists(%s) 透传给原始 sys", fileName => {
			expect(system.fileExists(fileName)).toBe(true);
			expect(calls).toContain(`fileExists:${fileName}`);
			expect(system.readFile(fileName)).toBe("content");
		});
	});

	describe("路径归一化", () => {
		it("outDir 为 Windows 反斜杠路径时仍可命中", () => {
			const { sys } = createMockSys();
			const system = createDtsHidingSystem("C:\\project\\es", sys);
			expect(system.fileExists("C:/project/es/index.d.ts")).toBe(false);
			expect(system.fileExists("C:/project/src/index.ts")).toBe(true);
		});

		it("outDir 带尾部斜杠时行为一致", () => {
			const { sys } = createMockSys();
			const system = createDtsHidingSystem(`${OUT_DIR}/`, sys);
			expect(system.fileExists("/project/es/index.d.ts")).toBe(false);
			expect(system.fileExists("/project/es-extra/index.d.ts")).toBe(true);
		});

		it("大小写不敏感文件系统下忽略大小写", () => {
			const { sys } = createMockSys({ useCaseSensitiveFileNames: false });
			const system = createDtsHidingSystem(OUT_DIR, sys);
			expect(system.fileExists("/Project/ES/index.d.ts")).toBe(false);
		});

		it("大小写敏感文件系统下区分大小写", () => {
			const { sys } = createMockSys({ useCaseSensitiveFileNames: true });
			const system = createDtsHidingSystem(OUT_DIR, sys);
			expect(system.fileExists("/Project/ES/index.d.ts")).toBe(true);
		});
	});

	describe("symlink 场景 (monorepo / pnpm workspace)", () => {
		it("通过 node_modules symlink 指向 outDir 的 .d.ts 也应被隐藏", () => {
			const { sys } = createMockSys({
				realpath: (fileName: string) => {
					// node_modules/@scope/pkg -> ../../packages/components 的 symlink
					if (fileName.startsWith("/project/node_modules/@scope/pkg/")) {
						return fileName.replace(
							"/project/node_modules/@scope/pkg/",
							"/project/es/",
						);
					}
					return fileName;
				},
			});
			const system = createDtsHidingSystem(OUT_DIR, sys);
			// symlink 路径 realpath 后落在 outDir 下
			expect(
				system.fileExists(
					"/project/node_modules/@scope/pkg/index.d.ts",
				),
			).toBe(false);
			expect(
				system.readFile(
					"/project/node_modules/@scope/pkg/index.d.ts",
				),
			).toBeUndefined();
		});

		it("symlink 指向 outDir 外部的 .d.ts 不受影响", () => {
			const { sys } = createMockSys({
				realpath: (fileName: string) => {
					if (fileName.startsWith("/project/node_modules/@scope/other/")) {
						return fileName.replace(
							"/project/node_modules/@scope/other/",
							"/other-project/lib/",
						);
					}
					return fileName;
				},
			});
			const system = createDtsHidingSystem(OUT_DIR, sys);
			expect(
				system.fileExists(
					"/project/node_modules/@scope/other/index.d.ts",
				),
			).toBe(true);
		});

		it("sys.realpath 不存在时不报错, 按原始路径判断", () => {
			const { sys } = createMockSys({ realpath: undefined });
			const system = createDtsHidingSystem(OUT_DIR, sys);
			// symlink 路径前缀不匹配 outDir, 且无 realpath, 应透传
			expect(
				system.fileExists(
					"/project/node_modules/@scope/pkg/index.d.ts",
				),
			).toBe(true);
			// 直接 outDir 路径仍被隐藏
			expect(system.fileExists("/project/es/index.d.ts")).toBe(false);
		});
	});

	describe("边界情况", () => {
		it("outDir 为 undefined 时完全透传", () => {
			const { sys } = createMockSys();
			const system = createDtsHidingSystem(undefined, sys);
			expect(system.fileExists("/project/es/index.d.ts")).toBe(true);
			expect(system.readFile("/project/es/index.d.ts")).toBe("content");
		});

		it("保留原始 sys 的其他成员", () => {
			const { sys } = createMockSys();
			const system = createDtsHidingSystem(OUT_DIR, sys);
			expect(system.useCaseSensitiveFileNames).toBe(
				sys.useCaseSensitiveFileNames,
			);
			expect(system.writeFile).toBe(sys.writeFile);
		});
	});
});
