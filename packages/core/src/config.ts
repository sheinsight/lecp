import path from "node:path";
import { createJiti } from "jiti";
import { glob } from "tinyglobby";
import type { SystemConfig } from "./build.ts";
import { DEFAULT_NODE_TARGET, DEFAULT_WEB_TARGET } from "./constant.ts";
import type {
	BundleFormat,
	BundlessFormat,
	FormatType,
	UserConfig,
} from "./define-config.ts";
import { merge, pathExists } from "./util/index.ts";
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
		throw new Error(
			`配置文件不存在: ${configPath.replace(process.cwd(), ".")}`,
		);
	}

	files.add(configPath);
	const config = await loadConfig(configPath);

	const { extends: extendsFile, ...restConfig } = config;

	if (extendsFile) {
		const file = path.resolve(path.dirname(configPath), config.extends);
		if (files.has(file)) {
			logger.warn(`配置文件: ${configPath} 存在循环 extends`);
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

const defaultConfig: Partial<UserConfig> = {
	dts: true,
	sourcemap: true,
	targets: {}, // 默认值不能放到这里.可能会导致多个target 同时生效
	exclude: [],
	externalHelpers: false,
	react: {
		jsxRuntime: "classic",
	},
	alias: { "@": "./src" },
	define: {},
	css: {
		lessCompile: true,
	},
};

const defaultFormatConfig: Record<FormatType, BundlessFormat | BundleFormat> = {
	esm: {
		type: "esm",
		mode: "bundless",
		builder: "swc",
		entry: "src",
		outDir: "es",
	} as BundlessFormat,
	cjs: {
		type: "cjs",
		mode: "bundless",
		builder: "swc",
		entry: "src",
		outDir: "lib",
	} as BundlessFormat,
	umd: {
		type: "umd",
		mode: "bundle",
		builder: "rspack",
		outDir: "umd",
		fileName: "index",
		// entry:
		// name:
	} as BundleFormat,
};

const getDefaultEntry = async (cwd: string) => {
	const files = await glob(["./src/index.{tsx,ts,jsx,js}"], {
		cwd,
		absolute: true,
	});
	return files.sort().reverse().at(0);
};

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface FinalUserConfig
	extends Required<Omit<UserConfig, "extend" | "dts" | "css">> {
	format: Required<BundlessFormat | BundleFormat>[];
	name: string;
	dts?: Required<Exclude<UserConfig["dts"], boolean>>;
	css?: Prettify<UserConfig["css"] & { cssModules?: string }>;
}

export const getFinalUserOptions = (
	userConfig: UserConfig,
	systemConfig: SystemConfig,
) => {
	const buildOptions = merge<UserConfig>(defaultConfig, userConfig);

	if (!userConfig.targets) {
		const isCjsOnly = userConfig.format.every(item => item.type === "cjs");
		buildOptions.targets = isCjsOnly
			? { node: DEFAULT_NODE_TARGET }
			: { chrome: DEFAULT_WEB_TARGET };
	}

	buildOptions.format = userConfig.format.map(item => {
		return {
			...defaultFormatConfig[item.type],
			...item,
		} as BundlessFormat | BundleFormat;
	});

	if (buildOptions.dts) {
		buildOptions.dts = {
			type: "bundless",
			builder: "swc",
			// @ts-expect-error ...true ok
			...buildOptions.dts,
		};
	}

	if (buildOptions.css?.cssModules === true) {
		const pkgName = systemConfig.pkg.name;
		buildOptions.css.cssModules = `${pkgName.replace("@", "").replace("/", "__")}__[local]`;
	}

	return buildOptions as FinalUserConfig;
};
