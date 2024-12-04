import {
	coverageConfigDefaults,
	defineConfig,
	type ViteUserConfig,
} from "vitest/config";

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
}) as ViteUserConfig; // 不设置类型会报错 TS9037 --isolatedDeclarations
