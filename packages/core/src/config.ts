import path from "node:path";
import { createJiti } from "jiti";
import type { UserConfig } from "./define-config.ts";
import { pathExists } from "./util/index.ts";
import { logger } from "./util/logger.ts";

export const loadConfig = async (configPath: string): Promise<UserConfig> => {
	const jiti = createJiti(import.meta.url, { moduleCache: false });
	try {
		const config: UserConfig = await jiti.import(configPath, { default: true });
		return config;
	} catch (error) {
		logger.error("配置文件获取错误", configPath);
		throw error;
	}
};

export const getConfig = async (
	configPath: string,
): Promise<{
	config: UserConfig;
	files: Set<string>;
}> => {
	const files = new Set<string>([]);

	if (!(await pathExists(configPath))) {
		throw new Error(`配置文件不存在: ${configPath}`);
	}

	files.add(configPath);
	const config = await loadConfig(configPath);

	const { extends: extendsFile, ...restConfig } = config;

	if (extendsFile) {
		const file = path.resolve(path.dirname(configPath), config.extends);
		if (files.has(file)) {
			logger.warn(`配置文件: ${configPath} 被循环 extends,请检查!`);
		} else {
			if (!(await pathExists(file))) {
				logger.error("extends 配置文件不存在", file);
			} else {
				files.add(file);
				const extendConfig = await getConfig(file);

				return {
					config: {
						...extendConfig.config,
						...restConfig,
					},
					files,
				};
			}
		}
	}

	return {
		config,
		files,
	};
};

getConfig(path.resolve(import.meta.dirname, "../lecp.config.ts")).then(data =>
	console.log(data),
);
