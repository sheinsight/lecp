import path from "node:path";
import { logger, type LogLevel } from "./util/logger.ts";
import { getConfig } from "./config.ts";
import type { UserConfig } from "./define-config.ts";

export const build = (config: UserConfig): void => {
	logger.info("start build", config);
};

const CONFIG_FILE = "lecp.config.ts";

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
