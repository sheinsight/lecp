import path from "node:path";
import { getConfig } from "./config.ts";
import type { UserConfig } from "./define-config.ts";
import { type LogLevel, logger } from "./util/logger.ts";

export const build = async (config: UserConfig): Promise<void> => {
	logger.info("start build", config);
};

const CONFIG_FILE = "lecp.config.ts";
// const CONFIG_FILE = "lecp2.config.ts";

export interface Options {
	cwd: string;
	watch?: boolean;
	logLevel?: string;
}

// cwd -> configFiles, config
export const init = async (
	options: Options,
): Promise<ReturnType<typeof getConfig>> => {
	const { cwd, logLevel } = options;
	if (logLevel) logger.level = logLevel as LogLevel;

	const configFile = path.resolve(cwd, CONFIG_FILE);

	const { files, config } = await getConfig(configFile);

	return { files, config };
};
