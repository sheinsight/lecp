import path from "node:path";
import { transformDtsAsync } from "@shined/lecp-binding";
import chokidar from "chokidar";
import fs from "fs/promises";
import colors from "picocolors";
import { glob } from "tinyglobby";
import ts from "typescript";
import tsPathsTransformer from "typescript-transform-paths";
import type { SystemConfig, Watcher } from "../build.ts";
import type { TransformResult } from "../bundless/index.ts";
import { testPattern, testPatternForTs } from "../constant.ts";
import type {
	FinalBundleFormat,
	FinalBundlessFormat,
} from "../define-config.ts";
import { getOutJsExt } from "../util/index.ts";
import { logger } from "../util/logger.ts";
import { createExtensionRewriteTransformer } from "./tx-extension-rewrite.ts";

/**
 * 参考配置 @see https://github.com/Swatinem/rollup-plugin-dts/blob/master/src/program.ts
 * 为(加速)生成 dts.用户不可修改的配置
 */
export const OVERRIDE_TS_OPTIONS: ts.CompilerOptions = {
	// Ensure ".d.ts" modules are generated
	declaration: true,
	// Skip ".js" generation
	noEmit: false,
	emitDeclarationOnly: true,
	// Skip code generation when error occurs
	// noEmitOnError: true,
	// Avoid extra work
	checkJs: false,
	skipLibCheck: true,
};

// 默认开启.用户可修改的配置
export const DEFAULT_TS_OPTIONS: ts.CompilerOptions = {
	// 是否生成 d.ts.map 交由用户取舍.需配合src使用
	declarationMap: true,
	/** 可能和 pnpm 不兼容,暂时关闭,交由用户取舍, @see https://github.com/Swatinem/rollup-plugin-dts/issues/143 */
	// Ensure TS2742 errors are visible
	// preserveSymlinks: true,
	// Ensure we can parse the latest code
	target: ts.ScriptTarget.ESNext,
	/** 保持和 babel-plugin-transform-typescript 一致, @see https://github.com/babel/babel/issues/14421 */
	isolatedModules: true,
	// preserveValueImports: true,  // can only be used when 'module' is set to 'es2015' or later.
};

export const getDiagnosticsLog = (diagnostics?: ts.Diagnostic[]): string => {
	if (!diagnostics) return "";

	const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
		getCanonicalFileName: (fileName: string) =>
			ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	};

	return ts
		.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost)
		.trim();
};

export const getTsConfigFileContent = (options: {
	cwd: string;
	exclude?: string[];
}): ts.ParsedCommandLine => {
	const { cwd, exclude = [] } = options;
	const configFile = ts.findConfigFile(cwd, ts.sys.fileExists);
	if (!configFile) {
		logger.error(`cannot find tsconfig.json in ${cwd}`);
		return {} as never;
	}

	const { config, error } = ts.readConfigFile(configFile, ts.sys.readFile);
	if (error) {
		logger.error(getDiagnosticsLog([error]));
		return {} as never;
	}

	// extends includes 文件是相对于当前文件的. 继承后的路径不是想要的,如果不重新指定的话
	// ['src/**/*'] -> ['../../src/**/*']  (extends: '../../tsconfig.json')
	// 如何根据 extends 还原相对路径? 暂时写死 ['src/**/*']
	config.include = ["src/**/*"]; // 影响 fileNames 生成
	config.exclude = testPatternForTs.concat(config.exclude || [], exclude);

	return ts.parseJsonConfigFileContent(config, ts.sys, cwd);
};

/**
 * 编译 ts 到 dts
 */
const bundlessEmitDts = async (
	bundlessOptions: BundlessOptions,
	config: SystemConfig,
	onSuccess?: () => void,
): Promise<Watcher | void> => {
	const { cwd, watch } = config;
	const { outDir: typesDir, type: format, targets } = bundlessOptions;

	const outJsExt = getOutJsExt(
		!!targets.node,
		config.pkg.type === "module",
		format,
	);

	const { fileNames, options } = getTsConfigFileContent({ cwd, exclude: [] });
	logger.debug("dts 编译文件: ", fileNames);

	// 没有文件提前退出
	if (!fileNames?.length && !watch) return;
	logger.debug("user tsconfig options: ", options);

	const overrideTsconfig = {
		...OVERRIDE_TS_OPTIONS,
		outDir: typesDir,
		declarationDir: typesDir,
		incremental: false,
	};

	// 暂时优先使用内部配置.可以优化速度
	const compilerOptions: ts.CompilerOptions = {
		...DEFAULT_TS_OPTIONS,
		...options,
		...overrideTsconfig,
	};

	logger.debug("final tsconfig options: ", compilerOptions);

	if (watch) {
		return watchDeclaration(fileNames, compilerOptions, outJsExt, onSuccess);
	}

	emitDeclaration(fileNames, compilerOptions, outJsExt, onSuccess);
};

/**
 *  - 修正 d.ts 的文件名 和 # sourceMappingURL文件名
 *  - 修正 d.ts.map 的 file 字段
 */
const createCustomWriteFile = (
	outJsExt: string,
	writeFile = ts.sys.writeFile,
): ts.WriteFileCallback => {
	return (fileName, data, writeByteOrderMark, onError) => {
		// cjs, mjs -> cts, mts
		let outDtsExt = outJsExt.replace(/^(c|m)?js$/, "$1ts");

		const isMapFile = fileName.endsWith(".map");

		const outputFileName = isMapFile
			? fileName.replace(/\.(c|m)?(t|j)s.map$/, `.${outDtsExt}.map`)
			: fileName.replace(/\.(c|m)?(t|j)s$/, `.${outDtsExt}`);

		// source.file: "index.d.ts" -> "file":"index.d.cts"
		if (isMapFile) {
			const sourceMap = JSON.parse(data);
			sourceMap.file = path.basename(outputFileName).replace(/\.map$/, "");
			data = JSON.stringify(sourceMap);
		} else {
			//# sourceMappingURL=index.d.ts.map -> index.d.cts.map
			const lines = data.split("\n").slice(0, -1);
			data = lines
				.concat(`//# sourceMappingURL=${path.basename(outputFileName)}.map`)
				.join("\n");
		}

		try {
			writeFile(outputFileName, data, writeByteOrderMark);
		} catch (error) {
			// @ts-expect-error
			onError?.(error.message);
		}
	};
};

/**
 * 编译 ts 到 dts (tsc --emitDeclarationOnly --declaration)
 */
const emitDeclaration = (
	files: string[],
	compilerOptions: ts.CompilerOptions,
	outJsExt: string,
	onSuccess?: () => void,
): void => {
	const program = ts.createProgram({
		rootNames: files,
		options: compilerOptions,
	});

	// d.ts.map, d.ts
	const writeFile = createCustomWriteFile(outJsExt);

	const { diagnostics } = program.emit(undefined, writeFile, undefined, true, {
		afterDeclarations: [
			// @ts-expect-error 兼容 cjs,esm 加载
			(tsPathsTransformer?.default ?? tsPathsTransformer)(program),
			// .cjs, .mjs 后缀转换
			createExtensionRewriteTransformer({ ext: "." + outJsExt }),
		],
	});

	const log = getDiagnosticsLog(
		ts.getPreEmitDiagnostics(program).concat(diagnostics),
	);
	log && logger.error(log);

	onSuccess?.();
};

/**
 * 编译 ts 到 dts (tsc --watch --emitDeclarationOnly --declaration)
 */
const watchDeclaration = (
	files: string[],
	compilerOptions: ts.CompilerOptions,
	outJsExt: string,
	onSuccess?: () => void,
): ts.WatchOfConfigFile<ts.BuilderProgram> => {
	logger.debug("watching dts...");
	const host = ts.createWatchCompilerHost(
		files,
		compilerOptions,
		ts.sys,
		ts.createSemanticDiagnosticsBuilderProgram,
		function reportDiagnostic(diagnostic) {
			logger.error(getDiagnosticsLog([diagnostic]));
		},
		function reportWatchStatusChanged(diagnostic) {
			// TS6031, TS6032  Starting compilation
			if (![6031, 6032].includes(diagnostic.code)) {
				// logger.info(getDiagnosticsLog([diagnostic]));
				onSuccess?.();
			}
		},
	);

	const originalAfterProgramCreate = host.afterProgramCreate;

	host.afterProgramCreate = program => {
		const originalEmit = program.emit;
		program.emit = (
			targetSourceFile,
			writeFile,
			cancellationToken,
			emitOnlyDtsFiles,
			customTransformers,
		): ts.EmitResult => {
			const transformers = customTransformers ?? {};
			transformers.afterDeclarations ??= [];
			transformers.afterDeclarations.concat(
				// @ts-expect-error 兼容 cjs,esm 加载
				(tsPathsTransformer?.default ?? tsPathsTransformer)(
					program.getProgram(),
				),
				// .cjs, .mjs 后缀转换
				createExtensionRewriteTransformer({ ext: "." + outJsExt }),
			);

			return originalEmit(
				targetSourceFile,
				createCustomWriteFile(outJsExt, writeFile),
				cancellationToken,
				emitOnlyDtsFiles,
				transformers,
			);
		};

		originalAfterProgramCreate?.(program);
	};

	const watcher = ts.createWatchProgram(host);
	return watcher;
};

/**
 * 编译 ts 到 dts (emitIsolatedDts, ts)
 * ts@5.5.2+ (ts.transpileDeclaration)
 */
export const tsTransformDeclaration = async (
	fileName: string,
	compilerOptions: ts.CompilerOptions,
	outJsExt: string,
): Promise<TransformResult | undefined> => {
	const code = ts.sys.readFile(fileName);
	if (code === undefined) {
		logger.error(`file not found: ${fileName}`);
		return;
	}

	const { outputText, diagnostics, sourceMapText } = ts.transpileDeclaration(
		code,
		{
			compilerOptions,
			fileName,
			reportDiagnostics: true,
			// other ts.TranspileOptions
			// moduleName?: string;
			// renamedDependencies?: MapLike<string>;
			transformers: {
				afterDeclarations: [
					// @ts-expect-error 兼容 cjs,esm 加载
					(tsPathsTransformer?.default ?? tsPathsTransformer)(
						undefined,
						undefined,
						undefined,
						// transpileDeclaration 无 program, 需要手动设置
						{ fileNames: [fileName], compilerOptions: compilerOptions },
					),
					// .cjs, .mjs 后缀转换
					createExtensionRewriteTransformer({ ext: "." + outJsExt }),
				].filter(Boolean),
			},
			// jsDocParsingMode?: JSDocParsingMode;
		},
	);

	const log = getDiagnosticsLog(diagnostics);
	log && logger.error(log);

	return {
		code: outputText,
		map: sourceMapText,
	};
};

type BundlessOptions = FinalBundleFormat | FinalBundlessFormat;

async function bundlessTransformDts(
	options: BundlessOptions,
	config: SystemConfig,
	onSuccess?: () => void,
): Promise<void | Watcher> {
	const { entry: srcDir, outDir, type: format, dts, targets } = options;
	const { pkg, cwd, tsconfig, watch } = config;

	const excludePatterns = testPattern.concat(
		"**/*.d.ts",
		options.exclude ?? [],
	);

	const files = await glob("**/*.{ts,tsx}", {
		cwd: srcDir,
		absolute: true,
		ignore: excludePatterns,
	});

	const outJsExt = getOutJsExt(
		!!targets.node,
		config.pkg.type === "module",
		format,
	);
	const outDtsExt = outJsExt.replace(/^(c|m)?js$/, "$1ts");

	const dtsBuilders = {
		swc: async (file: string) => {
			try {
				const code = await transformDtsAsync(
					file,
					Buffer.from(
						JSON.stringify({
							...options,
							cwd,
							format,
							isModule: pkg.type === "module",
							// targets: {}, // -> !node, 不转换 cjs，mjs 后缀。
						}),
					),
				);
				return { code } as TransformResult;
			} catch (error: any) {
				logger.error(error);
			}
		},
		ts: (file: string) => {
			return tsTransformDeclaration(
				file,
				{ ...tsconfig, outDir, declarationDir: outDir, rootDir: srcDir },
				outJsExt,
			);
		},
	};

	const compileFile = async (file: string) => {
		const filePath = file.replace(srcDir, "");
		const fileRelPath = file.replace(`${cwd}/`, "");

		// outJsExt .cjs, .mjs -> .d.cts, .d.mts
		const outFilePath = path.join(
			outDir,
			// tsx -> .d.ts
			filePath
				.replace(/\.(t|j)sx?$/, ".d.ts")
				.replace(/\.(c|m)?(t|j)s$/, `.${outDtsExt}`),
		);
		const outFileRelPath = outFilePath.replace(`${cwd}/`, "");

		logger.info(
			`bundless(dts)`,
			`${colors.yellow(fileRelPath)} to ${colors.blackBright(outFileRelPath)}`,
		);

		const result = await dtsBuilders[dts.builder](file);
		if (!result) return;
		let { code, map } = result;

		if (map) {
			const outFilename = path.basename(outFilePath);

			// 修正 sourcemap.file
			const sourceMap = JSON.parse(map);
			sourceMap.file = outFilename;
			map = JSON.stringify(sourceMap);

			// 修正 sourceMappingURL
			const lines = code.split("\n").slice(0, -1);
			code = lines.concat(`//# sourceMappingURL=${outFilename}.map`).join("\n");
		}

		await fs.mkdir(path.dirname(outFilePath), { recursive: true });

		// .d.ts
		await fs.writeFile(outFilePath, code);
		onSuccess?.();

		// d.ts.map
		map && (await fs.writeFile(outFilePath + ".map", map));
	};

	await Promise.all(files.map(compileFile));

	if (watch) {
		const watcher = chokidar.watch(".", {
			cwd: srcDir,
			ignoreInitial: true,
			ignored: await glob(excludePatterns, { cwd: srcDir }),
		});

		watcher.on("all", async (event, file) => {
			try {
				if (event === "add" || event === "change") {
					return compileFile(path.join(srcDir, file));
				}

				if (event === "unlink") {
					// if (
					// 	dts?.mode === "bundless" &&
					// 	tsconfig?.isolatedDeclarations
					// ) {
					// 	// d.ts
					// 	const outDtsFilePath = getOutFilePath(file, "script");
					// 	if (tsconfig?.declarationMap)
					// 		fs.rm(outDtsFilePath + ".map");
					// 	fs.rm(outDtsFilePath);
					// }
				}
			} catch (error) {
				logger.debug(error);
			}
		});

		return watcher;
	}
}

export async function bundlessDts(
	options: BundlessOptions,
	config: SystemConfig,
	onSuccess?: () => void,
): Promise<void | Watcher> {
	const { tsconfig } = config;
	if (tsconfig?.isolatedDeclarations) {
		return bundlessTransformDts(options, config, onSuccess);
	} else {
		return bundlessEmitDts(options, config, onSuccess);
	}
}
