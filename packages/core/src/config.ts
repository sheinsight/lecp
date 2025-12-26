import path from "node:path";
import { createJiti } from "jiti";
import type { SystemConfig } from "./build.ts";
import { tsPathsToAlias } from "./bundless/swc.ts";
import { DEFAULT_NODE_TARGET, DEFAULT_WEB_TARGET } from "./constant.ts";
import type {
	BuildTarget,
	BundleFormat,
	BundlessFormat,
	DtsOptions,
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
		// runtime: "automatic",
		// importSource: "react",
	},
	// alias: {},
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

const defaultDtsConfig: DtsOptions = {
	mode: "bundless",
	builder: "ts",
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

			// bundle 模式下，默认从package.json 自动获取 externals
			if (["esm", "cjs"].includes(data.type)) {
				data.externals =
					data.externals ??
					Object.keys({
						...pkg.dependencies,
						...pkg.optionalDependencies,
						...pkg.peerDependencies,
					});
			}
		}

		if (data.outDir) data.outDir = path.resolve(cwd, data.outDir);
		if (data.entry) data.entry = path.resolve(cwd, data.entry);

		return data as FinalUserConfig["format"][0];
	});

	return buildOptions as FinalUserConfig;
};

/**
 * The esX to browserslist mapping is transformed from
 * https://github.com/rspack-contrib/browserslist-to-es-version
 */
const ESX_TO_BROWSERSLIST: Record<string, Record<string, string>> = {
	es5: {
		chrome: "13",
		edge: "12",
		firefox: "2",
		ios: "6",
		node: "0.6",
		safari: "5.1",
	},
	get es6() {
		return ESX_TO_BROWSERSLIST.es2015;
	},
	es2015: {
		chrome: "51",
		edge: "79",
		firefox: "53",
		ios: "16.3",
		node: "6.5",
		safari: "16.3",
	},
	es2016: {
		chrome: "52",
		edge: "79",
		firefox: "53",
		ios: "16.3",
		node: "7",
		safari: "16.3",
	},
	es2017: {
		chrome: "55",
		edge: "79",
		firefox: "53",
		ios: "16.3",
		node: "7.6",
		safari: "16.3",
	},
	es2018: {
		chrome: "64",
		edge: "79",
		firefox: "78",
		ios: "16.3",
		node: "10",
		safari: "16.3",
	},
	es2019: {
		chrome: "66",
		edge: "79",
		firefox: "78",
		ios: "16.3",
		node: "10",
		safari: "16.3",
	},
	es2020: {
		chrome: "91",
		edge: "91",
		firefox: "80",
		ios: "16.3",
		node: "16.9",
		safari: "16.3",
	},
	es2021: {
		chrome: "91",
		edge: "91",
		firefox: "80",
		ios: "16.3",
		node: "16.9",
		safari: "16.3",
	},
	es2022: {
		chrome: "94",
		edge: "94",
		firefox: "93",
		ios: "16.4",
		node: "16.11",
		safari: "16.4",
	},
	// ES2023 did not introduce new ECMA syntax, so map it to ES2022.
	// SWC currently supports syntax only up to ES2022
	get es2023() {
		return ESX_TO_BROWSERSLIST.es2022;
	},
	get es2024() {
		return ESX_TO_BROWSERSLIST.es2022;
	},
	get es2025() {
		return ESX_TO_BROWSERSLIST.es2022;
	},
	get esnext() {
		return ESX_TO_BROWSERSLIST.es2022;
	},
} as const;

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

	// 从 tsconfig 中 追加配置
	if (systemConfig.tsconfig) {
		const { paths, jsx, jsxImportSource } = systemConfig.tsconfig;

		if (paths) {
			options.alias = { ...tsPathsToAlias(paths), ...options.alias };
		}

		// swc jsc.transform.react.runtime <-> tsconfig jsx
		const jsxValue = [
			undefined,
			"preserve",
			"classic",
			"preserve",
			"automatic",
			"automatic",
		] as const;

		options.react = {
			runtime: jsx && jsxValue[jsx] ? jsxValue[jsx] : "automatic",
			importSource: jsxImportSource ?? "react",
			...options.react,
		};
	}

	// esXXXX -> browserslist
	if (options.targets) {
		const expandedTargets: BuildTarget = {};
		const esVersionKeys = Object.keys(ESX_TO_BROWSERSLIST);

		for (const [key, value] of Object.entries(options.targets)) {
			const esKey = (
				key.toLowerCase() === "es" ? `es${value}` : key
			).toLowerCase();

			if (esKey.startsWith("es")) {
				if (esVersionKeys.includes(esKey)) {
					// Helper to apply browser targets from ESX mapping
					const browserTargets = ESX_TO_BROWSERSLIST[esKey];
					if (browserTargets) {
						for (const [browser, version] of Object.entries(browserTargets)) {
							expandedTargets[browser] ??= options.targets[browser] ?? version;
						}
					}
				} else {
					logger.warn("unknown es version for target:", esKey);
				}
			} else {
				expandedTargets[key] = value;
			}
		}

		options.targets = expandedTargets;
	}

	if (!options.targets || Object.keys(options.targets).length === 0) {
		const isCjsOnly = format.every(item => item.type === "cjs");
		options.targets = isCjsOnly
			? { node: DEFAULT_NODE_TARGET }
			: { chrome: DEFAULT_WEB_TARGET };
	}

	return options as FinalBundleFormat | FinalBundlessFormat;
}
