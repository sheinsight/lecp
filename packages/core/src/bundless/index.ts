import fs from "node:fs/promises";
import path from "node:path";
import { transformFile } from "@swc/core";
import chokidar, { type FSWatcher } from "chokidar";
import colors from "picocolors";
import { glob } from "tinyglobby";
import type { SystemConfig } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import { testPattern } from "../constant.ts";
import type { BundlessFormat } from "../define-config.ts";
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

interface CompileStyleOptions {
	srcDir: string;
	outDir: string;
	//
	sourcemap: boolean;
	targets: BundlessOptions["targets"];
}

export const compileStyle = async (
	file: string,
	{ srcDir, outDir, sourcemap, targets }: CompileStyleOptions,
): Promise<void> => {
	const filePath = file.replace(srcDir, "");
	const outFilePath = path.join(outDir, filePath.replace(/\.less$/, ".css"));
	const content = await fs.readFile(file, "utf-8");

	const { code, map } = await Promise.resolve({ code: content, map: "" })
		.then(({ code, map }) => {
			if (isLess.test(file)) {
				const options: TransformLessOptions = {
					filename: file,
					outFilePath,
					sourcemap,
				};
				return transformLess(code, options);
			}

			return { code, map };
		})
		.then(({ code, map }) => {
			const options = {
				filename: file,
				inputSourceMap: map,
				sourcemap,
				targets,
			};
			return transformCSS(code, options);
		});

	await fs.mkdir(path.dirname(outFilePath), { recursive: true });
	await fs.writeFile(outFilePath, code);

	if (map) {
		const mapFilePath = outFilePath + ".map";
		await fs.writeFile(mapFilePath, JSON.stringify(map));
	}
};

interface CompileScriptOptions {
	compile: (file: string) => Promise<{ code: string; map?: string }>;
	srcDir: string;
	outDir: string;
}
export const compileScript = async (
	file: string,
	{ compile, srcDir, outDir }: CompileScriptOptions,
): Promise<void> => {
	let { code, map } = await compile(file);

	const filePath = file.replace(srcDir, "");
	// TODO: (c|m)ts -> (c|m)js
	const outFilePath = path.join(
		outDir,
		filePath.replace(/\.tsx?$/, ".js").replace(/\.jsx$/, ".js"),
	);

	await fs.mkdir(path.dirname(outFilePath), { recursive: true });
	await fs.writeFile(outFilePath, code);

	if (map) {
		const mapFilePath = outFilePath + ".map";
		code += "\n//# sourceMappingURL=" + path.basename(mapFilePath);

		const mapJson: SourceMap = typeof map === "string" ? JSON.parse(map) : map;

		mapJson.file = path.basename(outFilePath);

		// 绝对路径 -> 相对路径
		if (mapJson.sources) {
			mapJson.sources = mapJson.sources.map(filePath =>
				path.relative(path.dirname(outFilePath), filePath),
			);
		}

		await fs.writeFile(mapFilePath, JSON.stringify(mapJson));
	}
};

interface CopyAssetOptions {
	srcDir: string;
	outDir: string;
}
export const copyAsset = async (
	file: string,
	{ srcDir, outDir }: CopyAssetOptions,
): Promise<void> => {
	const filePath = file.replace(srcDir, "");
	const outFilePath = path.join(outDir, filePath);
	await fs.mkdir(path.dirname(outFilePath), { recursive: true });
	await fs.copyFile(file, outFilePath);
};

const isLess = /\.less$/;
const isCss = /\.css$/;
const isScript = /\.(c|m)?(t|j)sx?$/;
const isDts = /\.d\.(c|m)?tsx?$/;

type BundlessOptions = Omit<FinalUserConfig, "format"> &
	Required<BundlessFormat>;

export const bundlessFiles = async (
	options: BundlessOptions,
	config: SystemConfig,
): Promise<FSWatcher[] | undefined> => {
	const { cwd, watch } = config;
	const { exclude, outDir: _outDir, css, type: format } = options;
	const { sourcemap, targets } = options;

	const srcDir = path.join(cwd, "src");
	const outDir = path.join(cwd, _outDir);

	const excludePatterns = testPattern.concat(exclude);
	const files = await glob("**/*", { cwd: srcDir, ignore: excludePatterns });

	const compileFile = async (file: string) => {
		const fileRelPath = file.replace(cwd, "");
		// console.log(fileRelPath);

		if (isCss.test(file) || (isLess.test(file) && css?.lessCompile)) {
			logger.info(colors.white(`编译样式:`), colors.yellow(fileRelPath));
			await compileStyle(file, { srcDir, outDir, sourcemap, targets });
			return;
		}

		if (isScript.test(file) && !isDts.test(file)) {
			logger.info(colors.white(`编译到${format}:`), colors.yellow(fileRelPath));

			await compileScript(file, {
				compile: async file => {
					const swcOptions = getSwcOptions(options, config);
					return transformFile(file, swcOptions);
				},
				srcDir,
				outDir,
			});
			return;
		}

		logger.info(colors.white(`复制文件:`), colors.yellow(fileRelPath));
		await copyAsset(file, { srcDir, outDir });
	};

	files.map(file => path.join(srcDir, file)).forEach(compileFile);

	if (watch) {
		const watcher = chokidar.watch(".", {
			cwd: srcDir,
			ignoreInitial: true,
			ignored: await glob(excludePatterns, { cwd: srcDir }),
		});

		return [watcher];
	}
};
