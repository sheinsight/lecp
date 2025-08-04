/** 测试相关文件(glob格式) */
export const testPattern: string[] = [
	"**/fixtures{,/**}",
	"**/demos{,/**}",
	"**/mocks{,/**}",
	"**/__test__{,/**}",
	"**/__snapshots__{,/**}",
	"**/*.+(test|e2e|spec).*",
];

/** @see https://www.typescriptlang.org/tsconfig#include 支持的glob格式比较少 */
export const testPatternForTs: string[] = [
	"**/fixtures",
	"**/fixtures/**/*",
	"**/demos",
	"**/demos/**/*",
	"**/mocks",
	"**/mocks/**/*",
	"**/__test__",
	"**/__test__/**/*",
	"**/__snapshots__",
	"**/__snapshots__/**/*",
	"**/*.test.*",
	"**/*.e2e.*",
	"**/*.spec.*",
];

// node v18 EOL -> 2025-04-30
// require(esm) -> node v20.19.0, v22.12.0.
export const DEFAULT_NODE_TARGET = "20.11.0";

// chrome 55
export const DEFAULT_WEB_TARGET = 55;
