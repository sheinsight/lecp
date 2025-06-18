import path from "node:path";
import {
	type Options as SwcOptions,
	transformFile as swcTransformFile,
} from "@swc/core";
import chokidar from "chokidar";
import fs from "fs/promises";
import colors from "picocolors";
import { glob } from "tinyglobby";
import ts, { type CompilerOptions } from "typescript";
import tsPathsTransformer from "typescript-transform-paths";
import type { SystemConfig, Watcher } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import { testPattern, testPatternForTs } from "../constant.ts";
import type { BundleFormat, BundlessFormat } from "../define-config.ts";
import { getOutJsExt, isJsx } from "../util/index.ts";
import { logger } from "../util/logger.ts";
import type { TransformResult } from "./index.ts";
import { getSwcOptions } from "./swc.ts";

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
	const configFileName = ts.findConfigFile(cwd, ts.sys.fileExists);
	if (!configFileName) {
		logger.error(`cannot find tsconfig.json in ${cwd}`);
		return {} as never;
	}

	const { config, error } = ts.readConfigFile(configFileName, ts.sys.readFile);
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
	config: SystemConfig,
	typesDir: string,
	onSuccess?: () => void,
): Promise<Watcher | void> => {
	const { cwd, watch } = config;

	const { fileNames, options } = getTsConfigFileContent({ cwd, exclude: [] });
	logger.verbose("dts 编译文件: ", fileNames);

	// 没有文件提前退出
	if (!fileNames?.length && !watch) return;
	logger.verbose("user tsconfig options: ", options);

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

	logger.verbose("final tsconfig options: ", compilerOptions);

	if (watch) {
		return watchDeclaration(fileNames, compilerOptions, onSuccess);
	}

	emitDeclaration(fileNames, compilerOptions, onSuccess);
};

/**
 * 编译 ts 到 dts (tsc --emitDeclarationOnly --declaration)
 */
export const emitDeclaration = (
	files: string[],
	compilerOptions: CompilerOptions,
	onSuccess?: () => void,
): void => {
	const program = ts.createProgram({
		rootNames: files,
		options: compilerOptions,
	});

	const { diagnostics } = program.emit(undefined, undefined, undefined, true, {
		afterDeclarations: [
			// @ts-expect-error 兼容 cjs,esm 加载
			(tsPathsTransformer?.default ?? tsPathsTransformer)(program),
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
export const watchDeclaration = (
	files: string[],
	compilerOptions: CompilerOptions,
	onSuccess?: () => void,
): ts.WatchOfConfigFile<ts.BuilderProgram> => {
	logger.verbose("watching dts...");
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
			transformers.afterDeclarations.push(
				// @ts-expect-error 兼容 cjs,esm 加载
				(tsPathsTransformer?.default ?? tsPathsTransformer)(
					program.getProgram(),
				),
			);

			return originalEmit(
				targetSourceFile,
				writeFile,
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
	compilerOptions: CompilerOptions,
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
						{ fileNames: [fileName], compilerOptions: compilerOptions },
					),
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

/**
 * 编译 ts 到 dts (emitIsolatedDts, swc)
 * swc@1.6.4 支持 (`jsc.experimental.emitIsolatedDts:true`)
 * @description 暂不支持生成 d.ts.map
 */
export const swcTransformDeclaration = async (
	fileName: string,
	swcOptions: SwcOptions,
): Promise<TransformResult | undefined> => {
	try {
		const defaultSwcOptions = {
			filename: fileName,
			jsc: {
				parser: {
					syntax: "typescript",
					tsx: false,
				},
				experimental: {
					emitIsolatedDts: true,
				},
			},
		};

		const result = await swcTransformFile(
			fileName,
			swcOptions ?? defaultSwcOptions,
		);

		// @ts-expect-error output exists
		const output = JSON.parse(result.output);
		return {
			code: output.__swc_isolated_declarations__,
		};
	} catch (error: any) {
		logger.error(error);
	}
};

type BundlessOptions = Omit<FinalUserConfig, "format"> &
	Required<BundlessFormat | BundleFormat>;

export async function bundlessTransformDts(
	options: BundlessOptions,
	config: SystemConfig,
	onSuccess?: () => void,
): Promise<void | Watcher> {
	const { entry: srcDir, outDir, targets, type: format, dts } = options;
	const { pkg, cwd, tsconfig, watch } = config;

	const excludePatterns = testPattern.concat(options.exclude ?? []);

	const files = await glob("**/*.ts", {
		cwd: srcDir,
		absolute: true,
		ignore: excludePatterns,
	});

	const dtsBuilders = {
		swc: (file: string) => {
			const outJsExt = getOutJsExt(
				!!targets.node,
				pkg.type === "module",
				format,
			);

			// baseUrl + paths
			const swcOptions = getSwcOptions(
				{
					...options,
					outJsExt: isJsx.test(file) ? ".js" : outJsExt,
					swcOptions: {
						// ...options.swcOptions,
						jsc: { experimental: { emitIsolatedDts: true } },
					},
				},
				config,
			);

			return swcTransformDeclaration(file, swcOptions);
		},
		ts: (file: string) =>
			tsTransformDeclaration(file, {
				...tsconfig,
				outDir,
				declarationDir: outDir,
				rootDir: srcDir,
			}),
	};

	const compileFile = async (file: string) => {
		const filePath = file.replace(srcDir, "");
		const fileRelPath = file.replace(`${cwd}/`, "");

		const outFilePath = path.join(
			outDir,
			filePath.replace(/\.(t|j)sx?$/, ".d.ts").replace(/\.(c|m)ts$/, ".d.$1ts"),
		);
		const outFileRelPath = outFilePath.replace(`${cwd}/`, "");

		logger.info(
			colors.white(`bundless(dts)`),
			`${colors.yellow(fileRelPath)} to ${colors.blackBright(outFileRelPath)}`,
		);

		const result = await dtsBuilders[dts.builder](file);
		if (!result) return;
		const { code, map } = result;

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
				logger.verbose(error);
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
		return bundlessEmitDts(config, options.outDir, onSuccess);
	}
}
