import path from "node:path";
import { type NormalizedPackageJson, readPackage } from "read-pkg";
import type { CompilerOptions } from "typescript";
import { getTsConfigFileContent } from "./bundless/dts.ts";
import { bundlessFiles } from "./bundless/index.ts";
import { getConfig, getFinalUserOptions } from "./config.ts";
import type { UserConfig } from "./define-config.ts";
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
	config: UserConfig,
	inputSystemConfig: InputSystemConfig,
): Promise<Watcher[]> => {
	logger.info("start build", config);

	const watchers: Watcher[] = [];
	const userConfig = getFinalUserOptions(config);
	const { format, ...others } = userConfig;

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

	for (const task of format) {
		if (task.mode === "bundless") {
			const watcher = await bundlessFiles({ ...task, ...others }, systemConfig);
			watchers.concat(watcher ?? []);
		}

		if (task.mode === "bundle") {
			// const watcher = await bundleFiles(buildOptions, systemConfig);
			// watchers.concat(watcher ?? []);
		}
	}

	return watchers ?? [];
};

const CONFIG_FILE = "lecp.config.ts";
// const CONFIG_FILE = "lecp2.config.ts";

// cwd -> configFiles, config
export const init = async (
	options: InputSystemConfig,
): Promise<ReturnType<typeof getConfig>> => {
	const { cwd, logLevel } = options;
	if (logLevel) logger.level = logLevel as LogLevel;

	const configFile = path.resolve(cwd, CONFIG_FILE);

	return getConfig(configFile);
};
