import fs from "node:fs/promises";
import path from "node:path";
import {
	transform as swcTransform,
	transformFile as swcTransformFile,
} from "@swc/core";
import chokidar from "chokidar";
import colors from "picocolors";
import { glob } from "tinyglobby";
import type { SystemConfig, Watcher } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import { testPattern } from "../constant.ts";
import type { BundlessFormat } from "../define-config.ts";
import {
	getOutJsExt,
	isCss,
	isDts,
	isJsx,
	isLess,
	isScript,
} from "../util/index.ts";
import { logger } from "../util/logger.ts";
import {
	type TransformLessOptions,
	transformCSS,
	transformLess,
} from "./style.ts";
import { getSwcOptions } from "./swc.ts";

export interface SourceMap {
	file?: string;
	sources?: string[];
}

export interface TransformResult {
	code: string;
	map?: string;
}

interface CompileStyleOptions {
	outFilePath: string;
	sourcemap: boolean;
	targets: BundlessOptions["targets"];
	cssModules: Exclude<BundlessOptions["css"], undefined>["cssModules"];
	minify: BundlessOptions["minify"];
}

const compileStyle = async (
	file: string,
	{ outFilePath, sourcemap, targets, cssModules, minify }: CompileStyleOptions,
): Promise<void> => {
	const content = await fs.readFile(file, "utf-8");

	let { code, map } = await Promise.resolve({ code: content, map: "" })
		.then(({ code, map }) => {
			if (isLess.test(file)) {
				const options: TransformLessOptions = {
					filename: file,
					sourcemap,
				};
				return transformLess(code, options);
			}

			return { code, map };
		})
		.then(({ code, map }) => {
			const options = {
				filename: file,
				outFilePath,
				inputSourceMap: map,
				sourcemap,
				targets,
				cssModules,
				minify,
			};
			return transformCSS(code, options);
		});

	await fs.mkdir(path.dirname(outFilePath), { recursive: true });

	if (map) {
		const mapFilePath = outFilePath + ".map";
		code += `\n/*# sourceMappingURL=${path.basename(mapFilePath)}*/`;

		// .css.map
		await fs.writeFile(outFilePath + ".map", map);
	}

	// .css
	await fs.writeFile(outFilePath, code);
};

interface CompileScriptOptions {
	compile: (file: string) => Promise<{ code: string; map?: string }>;
	outFilePath: string;
}
const compileScript = async (
	file: string,
	{ compile, outFilePath }: CompileScriptOptions,
): Promise<void> => {
	let { code, map } = await compile(file);

	const outDir = path.dirname(outFilePath);
	await fs.mkdir(outDir, { recursive: true });

	if (map) {
		const mapFilePath = outFilePath + ".map";
		code += `\n//# sourceMappingURL=${path.basename(mapFilePath)}`;

		const mapJson: SourceMap = typeof map === "string" ? JSON.parse(map) : map;
		mapJson.file = path.basename(outFilePath);

		// 绝对路径 -> 相对路径
		if (mapJson.sources) {
			mapJson.sources = mapJson.sources.map(filePath =>
				path.relative(outDir, filePath),
			);
		}

		// .js.map
		await fs.writeFile(mapFilePath, JSON.stringify(mapJson));
	}

	// .js
	await fs.writeFile(outFilePath, code);
};

interface CopyAssetOptions {
	srcDir: string;
	outDir: string;
}
const copyAsset = async (
	file: string,
	{ srcDir, outDir }: CopyAssetOptions,
): Promise<void> => {
	const filePath = file.replace(srcDir, "");
	const outFilePath = path.join(outDir, filePath);
	await fs.mkdir(path.dirname(outFilePath), { recursive: true });
	await fs.copyFile(file, outFilePath);
};

type BundlessOptions = Omit<FinalUserConfig, "format"> &
	Required<BundlessFormat>;

export const bundlessFiles = async (
	options: BundlessOptions,
	config: SystemConfig,
): Promise<Watcher[] | undefined> => {
	const { cwd, watch } = config;
	const { exclude, entry: srcDir, outDir, css, type: format } = options;
	const { sourcemap, targets, minify } = options;

	// 清除文件
	logger.info(`🧹 清除${format}目录: ${outDir.replace(cwd, "")}`);
	await fs.rm(outDir, { recursive: true, force: true });

	const outJsExt = getOutJsExt(
		!!targets.node,
		config.pkg.type === "module",
		format,
	);

	const isDefaultFormat =
		(format === "esm" && config.pkg.type === "module") ||
		(format === "cjs" && config.pkg.type !== "module");

	const getOutFilePath = (
		filePath: string,
		type: "script" | "style" | "dts",
	) => {
		let outFile = filePath;

		if (type === "style") {
			outFile = css?.lessCompile
				? filePath.replace(/\.less$/, ".css")
				: filePath;
		}

		// 目前暂不考虑 .cjs, .mjs源文件后缀对产物后缀的影响
		if (type === "script") {
			outFile = filePath
				.replace(/\.(t|j)sx$/, ".js")
				.replace(/\.(c|m)?(t|j)s$/, `.${outJsExt}`);
		}

		if (type === "dts") {
			outFile = filePath
				.replace(/\.(t|j)sx?$/, ".d.ts")
				.replace(/\.(c|m)ts$/, ".d.$1ts");
		}

		return path.join(outDir, outFile);
	};

	const compileFile = async (file: string) => {
		const fileRelPath = file.replace(cwd, "");
		const filePath = file.replace(srcDir, "");

		if (isCss.test(file) || (isLess.test(file) && css?.lessCompile)) {
			logger.info(colors.white(`编译样式:`), colors.yellow(fileRelPath));

			await compileStyle(file, {
				outFilePath: getOutFilePath(filePath, "style"),
				sourcemap,
				targets,
				cssModules: css?.cssModules,
				minify,
			});
			return;
		}

		if (isScript.test(file) && !isDts.test(file)) {
			logger.info(colors.white(`编译到${format}:`), colors.yellow(fileRelPath));

			await compileScript(file, {
				compile: async file => {
					const swcOptions = getSwcOptions(
						{ ...options, outJsExt: isJsx.test(file) ? "js" : outJsExt },
						config,
					);

					// 非默认 format: 先处理后缀再编译
					// esm: alias +.ts 后缀 无法同时处理, 需要二次编译
					if (!isDefaultFormat || swcOptions.jsc?.paths) {
						const { code } = await swcTransformFile(
							file,
							getSwcOptions(
								{ ...options, type: "esm", outJsExt: "js", shims: undefined },
								config,
							),
						);
						return swcTransform(code, { filename: file, ...swcOptions });
					}

					return swcTransformFile(file, swcOptions);
				},
				outFilePath: getOutFilePath(filePath, "script"),
			});

			return;
		}

		logger.info(colors.white(`复制文件:`), colors.yellow(fileRelPath));
		await copyAsset(file, { srcDir, outDir });
	};

	const excludePatterns = testPattern.concat(exclude);
	const files = await glob("**/*", {
		cwd: srcDir,
		ignore: excludePatterns,
		absolute: true,
	});
	files.forEach(compileFile);

	const watchers: Watcher[] = [];

	if (watch) {
		const watcher = chokidar.watch(".", {
			cwd: srcDir,
			ignoreInitial: true,
			ignored: await glob(excludePatterns, { cwd: srcDir }),
		});

		const handleChange = async (event: string, file: string) => {
			if (event === "add" || event === "change")
				return compileFile(path.join(srcDir, file));
			if (event === "unlinkDir")
				return fs.rm(path.join(outDir, file), { recursive: true, force: true });
			if (event === "unlink") {
				// style
				if (isLess.test(file) || isCss.test(file)) {
					const outFilePath = getOutFilePath(file, "style");
					if (sourcemap) fs.rm(outFilePath + ".map");
					fs.rm(outFilePath);
					return;
				}

				// script
				if (isScript.test(file) && !isDts.test(file)) {
					const outFilePath = getOutFilePath(file, "script");
					if (sourcemap) fs.rm(outFilePath + ".map");
					fs.rm(outFilePath);
					return;
				}

				// copy asset
				return fs.rm(path.join(outDir, file));
			}
		};

		watcher.on("all", async (event, file) => {
			try {
				await handleChange(event, file);
			} catch (error) {
				logger.verbose(error);
			}
		});

		watchers.push(watcher);
	}

	if (watch) return watchers;
};
