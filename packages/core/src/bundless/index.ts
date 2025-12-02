import fs from "node:fs/promises";
import path from "node:path";
import { bundlessFileAsync, bundlessFilesAsync } from "@shined/lecp-binding";
import chokidar from "chokidar";
import colors from "picocolors";
import { glob } from "tinyglobby";
import type { SystemConfig, Watcher } from "../build.ts";
import { testPattern } from "../constant.ts";
import type { FinalBundlessFormat } from "../define-config.ts";
import { getOutJsExt, isCss, isDts, isLess, isScript } from "../util/index.ts";
import { logger } from "../util/logger.ts";
import {
	type TransformLessOptions,
	transformCSS,
	transformLess,
} from "./style.ts";

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
	targets: FinalBundlessFormat["targets"];
	cssModules: Exclude<FinalBundlessFormat["css"]["cssModules"], boolean>;
	minify: FinalBundlessFormat["minify"];
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

const TITLE_WIDTH = 13;

export const bundlessFiles = async (
	options: FinalBundlessFormat,
	config: SystemConfig,
): Promise<Watcher[] | undefined> => {
	const { cwd, watch } = config;
	const { exclude, entry: srcDir, outDir, css, type: format, clean } = options;
	const { sourcemap, targets, minify } = options;

	// 清除文件
	if (clean) {
		logger.info(`🧹 clear directory: ${outDir.replace(cwd, ".")}`);
		await fs.rm(outDir, { recursive: true, force: true });
	}

	const outJsExt = getOutJsExt(
		!!targets.node,
		config.pkg.type === "module",
		format,
	);

	// const isDefaultFormat =
	// 	(format === "esm" && config.pkg.type === "module") ||
	// 	(format === "cjs" && config.pkg.type !== "module");

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
		const fileRelPath = file.replace(`${cwd}/`, "");
		const filePath = file.replace(srcDir, "");

		if (isCss.test(file) || (isLess.test(file) && css?.lessCompile)) {
			const outFilePath = getOutFilePath(filePath, "style");
			const outFileRelPath = outFilePath.replace(`${cwd}/`, "");
			logger.info(
				"compile style".padEnd(TITLE_WIDTH),
				`${colors.yellow(fileRelPath)} to ${colors.blackBright(outFileRelPath)}`,
			);

			await compileStyle(file, {
				outFilePath,
				sourcemap,
				targets,
				cssModules: css?.cssModules,
				minify,
			});
			return;
		}

		if (isScript.test(file) && !isDts.test(file)) {
			return;
		}

		logger.info("copy file".padEnd(TITLE_WIDTH), colors.yellow(fileRelPath));
		await copyAsset(file, { srcDir, outDir });
	};

	const excludePatterns = testPattern.concat(exclude);

	let bundlessOptions = {
		...options,
		format: options.type,
		isModule: config.pkg.type === "module",
		srcDir: options.entry,
		cwd,
	};

	// 是否可以收到 @shined/lecp-binding 内部??
	let res = bundlessFilesAsync(Buffer.from(JSON.stringify(bundlessOptions)));

	const files = await glob("**/*", {
		cwd: srcDir,
		ignore: excludePatterns,
		absolute: true,
	});

	await Promise.all([res, ...files.map(compileFile)]);

	const watchers: Watcher[] = [];

	if (watch) {
		const watcher = chokidar.watch(".", {
			cwd: srcDir,
			ignoreInitial: true,
			ignored: await glob(excludePatterns, { cwd: srcDir }),
		});

		const handleChange = async (event: string, file: string) => {
			console.log(`file ${event}: ${colors.yellow(file)}`);

			if (event === "add" || event === "change") {
				let filePath = path.join(srcDir, file);
				if (isScript.test(file) && !isDts.test(file)) {
					return bundlessFileAsync(
						filePath,
						Buffer.from(JSON.stringify(bundlessOptions)),
					);
				}

				return compileFile(filePath);
			}

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
				logger.debug(error);
			}
		});

		watchers.push(watcher);
	}

	if (watch) return watchers;
};
