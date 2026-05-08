import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import chokidar from "chokidar";
import colors from "picocolors";
import { glob } from "tinyglobby";
import ts from "typescript";
import tsPathsTransformer from "typescript-transform-paths";
import type { SystemConfig, Watcher } from "../build.ts";
import { testPattern, testPatternForTs } from "../constant.ts";
import type {
	FinalBundleFormat,
	FinalBundlessFormat,
} from "../define-config.ts";
import { getOutJsExt } from "../util/index.ts";
import { logger } from "../util/logger.ts";
import { createExtensionRewriteTransformer } from "./tx-extension-rewrite.ts";

type BundlessOptions = FinalBundleFormat | FinalBundlessFormat;

async function getTsgoExePath(): Promise<string> {
	try {
		const require = createRequire(import.meta.url);
		const pkgJsonPath =
			require.resolve("@typescript/native-preview/package.json");
		const libPath = path.resolve(
			path.dirname(pkgJsonPath),
			"./lib/getExePath.js",
		);

		const mod = await import(pathToFileURL(libPath).href);
		const getExePath: () => string = mod.default;
		return getExePath();
	} catch {
		throw new Error(
			"tsgo builder requires '@typescript/native-preview' package. Install it as a devDependency:\n  pnpm add -D @typescript/native-preview",
		);
	}
}

function runTsgoCli(options: {
	exePath: string;
	cwd: string;
	tsconfigPath: string;
	declarationDir: string;
	rootDir: string;
	declarationMap: boolean;
}): Promise<void> {
	const {
		exePath,
		cwd,
		tsconfigPath,
		declarationDir,
		rootDir,
		declarationMap,
	} = options;

	const args = [
		"--project",
		tsconfigPath,
		"--declaration",
		"--emitDeclarationOnly",
		"--noEmit",
		"false",
		"--noCheck",
		"--skipLibCheck",
		"--declarationDir",
		declarationDir,
		"--rootDir",
		rootDir,
		...(declarationMap ? ["--declarationMap"] : []),
	];

	logger.debug("tsgo command:", exePath, args.join(" "));

	return new Promise((resolve, reject) => {
		const child = spawn(exePath, args, {
			cwd,
			stdio: ["inherit", "pipe", "pipe"],
		});

		let stderr = "";

		child.stdout?.on("data", (data: Buffer) => {
			const text = data.toString().trim();
			if (text) logger.info(`${colors.cyan("[tsgo]")} ${text}`);
		});

		child.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		child.on("close", code => {
			if (code !== 0) {
				if (stderr.trim()) logger.error(stderr.trim());
				reject(new Error(`tsgo exited with code ${code}`));
			} else {
				if (stderr.trim())
					logger.debug(`${colors.cyan("[tsgo]")} ${stderr.trim()}`);
				resolve();
			}
		});

		child.on("error", err => {
			reject(new Error(`Failed to spawn tsgo: ${err.message}`));
		});
	});
}

async function postProcessTsgoOutput(options: {
	tempDir: string;
	outDir: string;
	srcDir: string;
	outJsExt: string;
	outDtsExt: string;
	tsconfig: ts.CompilerOptions;
	cwd: string;
}): Promise<void> {
	const { tempDir, outDir, srcDir, outJsExt, outDtsExt, tsconfig, cwd } =
		options;

	const dtsFiles = await glob("**/*.d.{ts,mts,cts}", {
		cwd: tempDir,
		absolute: true,
	});

	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

	for (const dtsFile of dtsFiles) {
		const relPath = path.relative(tempDir, dtsFile);
		const content = await fs.readFile(dtsFile, "utf-8");

		// .d.ts -> .ts, .d.mts -> .mts, .d.cts -> .cts
		const srcExt = relPath.match(/\.d\.(m?ts|cts)$/)?.[1] ?? "ts";
		const originalSourcePath = path.join(
			srcDir,
			relPath.replace(/\.d\.(m?ts|cts)$/, `.${srcExt}`),
		);

		const sourceFile = ts.createSourceFile(
			originalSourcePath,
			content,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		// @ts-expect-error 兼容 cjs,esm 加载
		const pathsTransformer = (
			tsPathsTransformer?.default ?? tsPathsTransformer
		)(undefined, undefined, undefined, {
			fileNames: [originalSourcePath],
			compilerOptions: tsconfig,
		});

		const extensionTransformer = createExtensionRewriteTransformer({
			ext: `.${outJsExt}`,
		});

		const transformResult = ts.transform(sourceFile, [
			pathsTransformer,
			extensionTransformer,
		]);

		const transformed = transformResult.transformed[0]!;
		let code = printer.printFile(transformed as ts.SourceFile);
		transformResult.dispose();

		// 统一输出为 .d.{outDtsExt}（如 .d.ts 或 .d.cts）
		const outRelPath = relPath.replace(/\.d\.(m?ts|cts)$/, `.d.${outDtsExt}`);
		const outFilePath = path.join(outDir, outRelPath);

		// 处理 sourcemap 引用
		const mapFile = dtsFile + ".map";
		let hasSourceMap = false;
		try {
			await fs.access(mapFile);
			hasSourceMap = true;
		} catch {
			// no map file
		}

		if (hasSourceMap) {
			code = code.replace(
				/\/\/# sourceMappingURL=.*$/m,
				`//# sourceMappingURL=${path.basename(outFilePath)}.map`,
			);

			const mapContent = await fs.readFile(mapFile, "utf-8");
			const sourceMap = JSON.parse(mapContent);
			sourceMap.file = path.basename(outFilePath);
			if (Array.isArray(sourceMap.sources)) {
				sourceMap.sources = sourceMap.sources.map((src: string) => {
					const absSource = path.resolve(path.dirname(mapFile), src);
					return path.relative(path.dirname(outFilePath), absSource);
				});
			}
			const outMapPath = outFilePath + ".map";
			await fs.mkdir(path.dirname(outMapPath), { recursive: true });
			await fs.writeFile(outMapPath, JSON.stringify(sourceMap));
		} else {
			code = code.replace(/\/\/# sourceMappingURL=.*$/m, "");
		}

		await fs.mkdir(path.dirname(outFilePath), { recursive: true });
		await fs.writeFile(outFilePath, code);

		const srcFileRelPath = originalSourcePath.replace(`${cwd}/`, "");
		const outFileRelPath = outFilePath.replace(`${cwd}/`, "");
		logger.info(
			"bundless(dts)",
			`${colors.yellow(srcFileRelPath)} to ${colors.blackBright(outFileRelPath)}`,
		);
	}
}

async function runTsgoAndPostProcess(ctx: {
	exePath: string;
	cwd: string;
	tsconfigPath: string;
	srcDir: string;
	outDir: string;
	outJsExt: string;
	outDtsExt: string;
	format: string;
	declarationMap: boolean;
	tsconfig: ts.CompilerOptions;
	onSuccess?: () => void;
}): Promise<void> {
	const tempDir = await fs.mkdtemp(
		path.join(tmpdir(), `lecp-tsgo-${ctx.format}-`),
	);

	try {
		await runTsgoCli({
			exePath: ctx.exePath,
			cwd: ctx.cwd,
			tsconfigPath: ctx.tsconfigPath,
			declarationDir: tempDir,
			rootDir: ctx.srcDir,
			declarationMap: ctx.declarationMap,
		});

		await postProcessTsgoOutput({
			tempDir,
			outDir: ctx.outDir,
			srcDir: ctx.srcDir,
			outJsExt: ctx.outJsExt,
			outDtsExt: ctx.outDtsExt,
			tsconfig: ctx.tsconfig,
			cwd: ctx.cwd,
		});

		ctx.onSuccess?.();
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
}

export async function bundlessTsgoDts(
	options: BundlessOptions,
	config: SystemConfig,
	onSuccess?: () => void,
): Promise<void | Watcher> {
	const { outDir, type: format, targets, entry: srcDir } = options;
	const { cwd, pkg, watch, tsconfig } = config;

	const exePath = await getTsgoExePath();
	logger.debug("tsgo binary:", exePath);

	const originalTsconfigPath = ts.findConfigFile(cwd, ts.sys.fileExists);
	if (!originalTsconfigPath) {
		logger.error(`cannot find tsconfig.json in ${cwd}`);
		return;
	}

	const outJsExt = getOutJsExt(!!targets.node, pkg.type === "module", format);
	const outDtsExt = outJsExt.replace(/^(c|m)?js$/, "$1ts");
	const declarationMap = tsconfig?.declarationMap !== false;

	const tempTsconfigPath = path.join(cwd, `tsconfig.lecp-tsgo-${format}.json`);
	const tempTsconfig = {
		extends: `./${path.relative(cwd, originalTsconfigPath)}`,
		include: [`${path.relative(cwd, srcDir)}/**/*`],
		exclude: testPatternForTs.concat(options.exclude ?? []),
	};
	await fs.writeFile(tempTsconfigPath, JSON.stringify(tempTsconfig));

	const ctx = {
		exePath,
		cwd,
		tsconfigPath: tempTsconfigPath,
		srcDir,
		outDir,
		outJsExt,
		outDtsExt,
		format,
		declarationMap,
		tsconfig: tsconfig ?? {},
		onSuccess,
	};

	try {
		await runTsgoAndPostProcess(ctx);
	} finally {
		await fs.rm(tempTsconfigPath, { force: true });
	}

	if (watch) {
		const excludePatterns = testPattern.concat(
			"**/*.d.ts",
			options.exclude ?? [],
		);

		const watcher = chokidar.watch(".", {
			cwd: srcDir,
			ignoreInitial: true,
			ignored: excludePatterns,
		});

		let building = false;
		let dirty = false;
		let debounceTimer: ReturnType<typeof setTimeout> | undefined;
		let changedFiles: string[] = [];

		const cleanupDtsOutput = async (file: string) => {
			const dtsFile = path.join(
				outDir,
				file.replace(/\.(c|m)?(t|j)sx?$/, `.d.${outDtsExt}`),
			);
			await fs.rm(dtsFile, { force: true });
			await fs.rm(dtsFile + ".map", { force: true });
			logger.info(
				"bundless(dts)",
				`${colors.cyan("[tsgo]")} removed ${colors.blackBright(dtsFile.replace(`${cwd}/`, ""))}`,
			);
		};

		watcher.on("all", (event, file) => {
			if (!/\.(c|m)?(ts|tsx)$/.test(file)) return;

			if (event === "unlink") {
				cleanupDtsOutput(file);
				return;
			}

			if (event !== "add" && event !== "change") return;

			changedFiles.push(file);

			if (building) {
				dirty = true;
				return;
			}

			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				building = true;
				try {
					do {
						dirty = false;
						const files = changedFiles;
						changedFiles = [];
						logger.info(
							"bundless(dts)",
							`${colors.cyan("[tsgo]")} rebuilding due to ${files.map(f => colors.yellow(f)).join(", ")}...`,
						);
						await runTsgoAndPostProcess(ctx);
					} while (dirty);
				} catch (error) {
					logger.error(error);
					if (dirty) {
						dirty = false;
						changedFiles = [];
						setImmediate(() => watcher.emit("all", "change", "retry"));
					}
				} finally {
					building = false;
				}
			}, 100);
		});

		const originalClose = watcher.close.bind(watcher);
		watcher.close = async () => {
			clearTimeout(debounceTimer);
			return originalClose();
		};

		return watcher;
	}
}
