// eslint-disable no-await-in-loop
import fs from "node:fs/promises";
import path from "path";
import colors from "picocolors";
import { type NormalizedPackageJson, readPackage } from "read-pkg";
import type { CompilerOptions } from "typescript";
import { bundleDts } from "./bundle/dts.ts";
import { bundleFiles } from "./bundle/index.ts";
import { bundlessDts, getTsConfigFileContent } from "./bundless/dts.ts";
import { bundlessFiles } from "./bundless/index.ts";
import { getConfig, getFinalUserOptions } from "./config.ts";
import type { UserConfig } from "./define-config.ts";
import { measure, pathExists } from "./util/index.ts";
import { type LogLevel, logger } from "./util/logger.ts";

export interface InputSystemConfig {
	cwd: string;
	watch?: boolean;
	logLevel?: string;
}

export interface SystemConfig {
	cwd: string;
	watch: boolean;
	logLevel: string;
	pkg: NormalizedPackageJson;
	tsconfig?: CompilerOptions;
}

export interface Watcher {
	close(): Promise<void> | void;
}

export const build = async (
	userConfig: UserConfig,
	inputSystemConfig: InputSystemConfig,
): Promise<Watcher[]> => {
	logger.info("LECP start build");

	let watchers: Watcher[] = [];

	const systemConfig = {
		...inputSystemConfig,
		pkg: await readPackage({
			normalize: true,
			cwd: inputSystemConfig.cwd,
		}),
		tsconfig: getTsConfigFileContent({
			cwd: inputSystemConfig.cwd,
		}).options,
	} as SystemConfig;

	const options = getFinalUserOptions(userConfig, systemConfig);
	const { format, ...others } = options;
	const { cwd } = systemConfig;

	for (const task of format) {
		const { mode, outDir, dts } = task;
		logger.info(`\n${colors.white(`${mode} ${task.type}`)}`);

		if (mode === "bundless") {
			const watcher = await bundlessFiles({ ...others, ...task }, systemConfig);
			watchers = watchers.concat(watcher ?? []);
		}

		if (mode === "bundle") {
			const watcher = await bundleFiles({ ...others, ...task }, systemConfig);
			watchers = watchers.concat(watcher ?? []);
		}

		if (dts) {
			logger.info(`generate dts (${dts.mode})`);

		const { duration} = await	measure(async () => {
				if (dts.mode === "bundless") {
				const watcher = await bundlessDts({ ...others, ...task }, systemConfig);
				if (watcher) watchers.push(watcher);
			}

			if (dts.mode === "bundle") {
				const tempDir = path.join(cwd, ".lecp"); // api-extractor 在 node_module 下 合并 dts 失败
				if (!(await pathExists(tempDir))) {
					await fs.mkdir(tempDir);
					await fs.writeFile(path.resolve(tempDir, ".gitignore"), "**/*");
				}

				const tempOutDir = path.join(tempDir, path.relative(cwd, outDir));
				const watcher = await bundlessDts(
					{ ...others, ...task, outDir: tempOutDir },
					systemConfig,
					() => bundleDts({ srcDir: tempOutDir, outDir, cwd }),
				);
				if (watcher) watchers.push(watcher);
			}
			});

			logger.info(`dts generated in ${duration}ms`);
		}
	}

	return watchers ?? [];
};

const CONFIG_FILE = "lecp.config.ts";

// cwd -> configFiles, config
export const init = async (
	options: InputSystemConfig,
): Promise<ReturnType<typeof getConfig>> => {
	const { cwd, logLevel } = options;
	if (logLevel) logger.level = logLevel as LogLevel;

	const configFile = path.resolve(cwd, CONFIG_FILE);

	return getConfig(configFile);
};
