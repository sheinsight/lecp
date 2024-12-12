import path from "node:path";
import { transformFile as swcTransformFile } from "@swc/core";
import fs from "fs/promises";
import ts, { type CompilerOptions } from "typescript";
import tsPathsTransformer from "typescript-transform-paths";
import type { SystemConfig, Watcher } from "../build.ts";
import { testPatternForTs } from "../constant.ts";
import { logger } from "../util/logger.ts";
import type { TransformResult } from "./index.ts";

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
		logger.error(`${cwd}下未找到tsconfig.json`);
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
 * // program.emit
 */
export const bundlessDts = async (
	config: SystemConfig,
	typesDir: string,
): Promise<Watcher | void> => {
	const { cwd, watch } = config;
	// const { exclude } = config.buildConfig!;

	const src = path.join(cwd, "src");
	logger.verbose("dts编译目录:", src);

	const { fileNames, options } = getTsConfigFileContent({ cwd, exclude: [] });
	logger.verbose("dts编译文件: ", fileNames);

	// 没有文件提前退出
	if (!fileNames?.length && !watch) return;
	logger.verbose("用户tsconfig配置: ", options);

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

	logger.verbose("最终tsconfig配置: ", compilerOptions);

	if (watch) {
		return watchDeclaration(fileNames, compilerOptions);
	}

	emitDeclaration(fileNames, compilerOptions);
};

/**
 * 编译 ts 到 dts (tsc --emitDeclarationOnly --declaration)
 */
export const emitDeclaration = (
	files: string[],
	compilerOptions: CompilerOptions,
): void => {
	const program = ts.createProgram({
		rootNames: files,
		options: compilerOptions,
	});

	const { diagnostics } = program.emit(undefined, undefined, undefined, true, {
		// @ts-ignore 3.4.x ok why?
		afterDeclarations: [tsPathsTransformer.default(program)],
	});

	const log = getDiagnosticsLog(
		ts.getPreEmitDiagnostics(program).concat(diagnostics),
	);
	log && logger.error(log);
};

/**
 * 编译 ts 到 dts (tsc --watch --emitDeclarationOnly --declaration)
 */
export const watchDeclaration = (
	files: string[],
	compilerOptions: CompilerOptions,
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
			logger.info(getDiagnosticsLog([diagnostic]));
		},
	);
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
		logger.error(`文件不存在: ${fileName}`);
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
			// transformers?: CustomTransformers;
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
): Promise<TransformResult | undefined> => {
	try {
		const result = await swcTransformFile(fileName, {
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
		});

		// @ts-expect-error
		const output = JSON.parse(result.output);
		return {
			code: output.__swc_isolated_declarations__,
		};
	} catch (error: any) {
		logger.error(error);
	}
};

interface TransformDtsOption {
	transform: () => Promise<TransformResult | undefined>;
	outFilePath: string;
}

export const transformDts = async (
	file: string,
	{ transform, outFilePath }: TransformDtsOption,
): Promise<void> => {
	const result = await transform();
	if (!result) return;

	const { code, map } = result;

	await fs.mkdir(path.dirname(outFilePath), { recursive: true });

	// .d.ts
	fs.writeFile(outFilePath, code);

	// d.ts.map
	map && fs.writeFile(outFilePath + ".map", map);
};
