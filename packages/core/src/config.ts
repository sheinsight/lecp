import { createJiti } from "jiti";
import { logger } from "./util/logger.ts";

// TODO:
interface UserConfig {
	[key: string]: unknown;
}

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

// loadConfig("../../../lecp.config.ts").then(data => console.log(data));
