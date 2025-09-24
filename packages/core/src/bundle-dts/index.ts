import path from "node:path";
import {
	Extractor,
	ExtractorConfig,
	type ExtractorLogLevel,
} from "@microsoft/api-extractor";
import ts from "typescript";
import { OVERRIDE_TS_OPTIONS } from "../bundless-dts/index.ts";
import { logger } from "../util/logger.ts";

interface BundleDtsOptions {
	srcDir: string;
	outDir: string;
	cwd: string;
}

/**
 * 合并生成单一 dts 文件
 * @description 前置依赖已编译的 types 文件
 */
export const bundleDts = (options: BundleDtsOptions): void => {
	const { srcDir, outDir, cwd } = options;
	const configFile = ts.findConfigFile(cwd, ts.sys.fileExists);
	const extractorConfig = ExtractorConfig.prepare({
		configObject: {
			compiler: {
				tsconfigFilePath: configFile,
				skipLibCheck: true,
				overrideTsconfig: {
					compilerOptions: OVERRIDE_TS_OPTIONS,
					include: [`${srcDir}/**/*`],
				},
			},
			projectFolder: cwd,
			mainEntryPointFilePath: `${srcDir}/index.d.ts`,
			dtsRollup: {
				enabled: true,
				untrimmedFilePath: `${outDir}/index.d.ts`,
			},
			bundledPackages: [],
			messages: {
				extractorMessageReporting: {
					default: { logLevel: "error" as ExtractorLogLevel.Error },
					"ae-missing-release-tag": {
						logLevel: "none" as ExtractorLogLevel.None,
					},
				},
			},
		},
		configObjectFullPath: undefined,
		packageJsonFullPath: path.join(cwd, "package.json"),
	});

	try {
		const { succeeded } = Extractor.invoke(extractorConfig, {
			localBuild: true,
			showVerboseMessages: false,
			// 默认不输出info日志, 只输出error和 warn日志
			messageCallback: message => {
				// 通过修改handled 来控制输出默认日志
				if (message.logLevel === "info") message.handled = true;
				// debug("api-extractor: %O", message.text);
			},
		});
		if (!succeeded) {
			// errorCount, warningCount
			logger.error("bundle dts failed:");
		}
	} catch (error: any) {
		logger.error(
			"bundle dts failed:",
			error.unformattedMessage || error.message,
		);
	}
};
