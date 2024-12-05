export interface UserConfig {
	/** 继承的配置文件路径 */
	extends: string;
}

export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export const defineConfig = (config: UserConfigExport): UserConfigExport =>
	config;
