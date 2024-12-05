import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		env: {
			FORCE_COLOR: "1",
		},
		coverage: {
			provider: "v8",
			exclude: ["**/{examples}/**", ...coverageConfigDefaults.exclude],
		},
	},
}) as unknown; // 不设置类型会报错 TS9037 --isolatedDeclarations
