import path from "node:path";
import type { FSWatcher } from "chokidar";
import { type NormalizedPackageJson, readPackage } from "read-pkg";
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
}

export const build = async (
	config: UserConfig,
	systemConfig: SystemConfig,
): Promise<FSWatcher[]> => {
	logger.info("start build", config);

	const watchers: FSWatcher[] | undefined = [];
	const userConfig = getFinalUserOptions(config);
	const { format, ...others } = userConfig;

	systemConfig.pkg ??= await readPackage({
		normalize: true,
		cwd: systemConfig.cwd,
	});

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

	const { files, config } = await getConfig(configFile);

	return { files, config };
};
