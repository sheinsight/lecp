import path from "node:path";
import { createJiti } from "jiti";
import type { SystemConfig } from "./build.ts";
import { DEFAULT_NODE_TARGET, DEFAULT_WEB_TARGET } from "./constant.ts";
import type {
	BundleFormat,
	BundlessFormat,
	FinalBundleFormat,
	FinalBundlessFormat,
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
		const file = path.resolve(path.dirname(configPath), extendsFile);
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
	clean: true,
};

const defaultFormatConfig: Record<FormatType, BundlessFormat | BundleFormat> = {
	esm: {
		type: "esm",
		mode: "bundless",
		builder: "swc",
		entry: "src",
		outDir: "es",
		minify: false,
	} as BundlessFormat,
	cjs: {
		type: "cjs",
		mode: "bundless",
		builder: "swc",
		entry: "src",
		outDir: "lib",
		minify: false,
	} as BundlessFormat,
	umd: {
		type: "umd",
		mode: "bundle",
		builder: "rspack",
		outDir: "umd",
		entry: "src",
		minify: true,
		// name: pkg.name,
	} as BundleFormat,
};

const defaultDtsConfig = {
	mode: "bundless",
	builder: "swc",
};

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface FinalUserConfig extends Required<Omit<UserConfig, "extend">> {
	format: Required<BundleFormat | BundlessFormat>[];
	name?: string;
}

export const getFinalUserOptions = (
	userConfig: UserConfig,
	systemConfig: SystemConfig,
): FinalUserConfig => {
	const { cwd, pkg } = systemConfig;

	const buildOptions = merge<UserConfig>(defaultConfig, userConfig);

	buildOptions.format = userConfig.format.map(item => {
		const data = {
			...defaultFormatConfig[item.type],
			...item,
		};

		if (data.mode === "bundle") {
			data.name ??= pkg.name;
			data.fileName ??= "index";
		}

		if (data.outDir) data.outDir = path.resolve(cwd, data.outDir);
		if (data.entry) data.entry = path.resolve(cwd, data.entry);

		return data as FinalUserConfig["format"][0];
	});

	return buildOptions as FinalUserConfig;
};

// export function getFinalFormatOptions(
// 	userConfig: FinalUserConfig,
// 	formatOptions: Required<BundlessFormat>,
// 	systemConfig: SystemConfig,
// ): FinalBundlessFormat;
// export function getFinalFormatOptions(
// 	userConfig: FinalUserConfig,
// 	formatOptions: Required<BundleFormat>,
// 	systemConfig: SystemConfig,
// ): FinalBundleFormat;
export function getFinalFormatOptions(
	userConfig: FinalUserConfig,
	formatOptions: Required<BundlessFormat | BundleFormat>,
	systemConfig: SystemConfig,
): FinalBundleFormat | FinalBundlessFormat {
	const { format, ...commonOptions } = userConfig;

	const options = merge<Required<BundlessFormat | BundleFormat>>(
		commonOptions,
		formatOptions,
	);

	options.shims ??= false;
	if (options.shims === true) {
		options.shims = { legacy: false };
	}

	if (options.css?.cssModules === true) {
		options.css.cssModules = `${systemConfig.pkg.name.replace("@", "").replace("/", "__")}__[local]`;
	}

	if (options.dts) {
		options.dts = {
			...defaultDtsConfig,
			// @ts-expect-error ...true ok
			...options.dts,
		};
	}

	if (!options.targets) {
		const isCjsOnly = format.every(item => item.type === "cjs");
		options.targets = isCjsOnly
			? { node: DEFAULT_NODE_TARGET }
			: { chrome: DEFAULT_WEB_TARGET };
	}

	return options as FinalBundleFormat | FinalBundlessFormat;
}
