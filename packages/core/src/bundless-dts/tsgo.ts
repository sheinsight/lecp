import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { tmpdir } from "node:os";
import colors from "picocolors";
import { glob } from "tinyglobby";
import ts from "typescript";
import tsPathsTransformer from "typescript-transform-paths";
import type { SystemConfig, Watcher } from "../build.ts";
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
		const pkgJsonPath = require.resolve(
			"@typescript/native-preview/package.json",
		);
		const libPath = path.resolve(
			path.dirname(pkgJsonPath),
			"./lib/getExePath.js",
		);

		// Windows 需要 file:// 协议
		const fileUrl =
			process.platform === "win32"
				? new URL(`file:///${libPath.replace(/\\/g, "/")}`).href
				: libPath;

		const mod = await import(fileUrl);
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
	const { exePath, cwd, tsconfigPath, declarationDir, rootDir, declarationMap } =
		options;

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

		child.on("close", (code) => {
			if (code !== 0) {
				if (stderr.trim()) logger.error(stderr.trim());
				reject(new Error(`tsgo exited with code ${code}`));
			} else {
				resolve();
			}
		});

		child.on("error", (err) => {
			reject(
				new Error(`Failed to spawn tsgo: ${err.message}`),
			);
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

	const dtsFiles = await glob("**/*.d.ts", {
		cwd: tempDir,
		absolute: true,
	});

	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

	for (const dtsFile of dtsFiles) {
		const relPath = path.relative(tempDir, dtsFile);
		const content = await fs.readFile(dtsFile, "utf-8");

		// 用原始源文件路径作为 fileName，让文件系统检查正确解析
		const originalSourcePath = path.join(
			srcDir,
			relPath.replace(/\.d\.ts$/, ".ts"),
		);

		const sourceFile = ts.createSourceFile(
			originalSourcePath,
			content,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		// @ts-expect-error 兼容 cjs,esm 加载
		const pathsTransformer = (tsPathsTransformer?.default ?? tsPathsTransformer)(
			undefined,
			undefined,
			undefined,
			{ fileNames: [originalSourcePath], compilerOptions: tsconfig },
		);

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

		// 计算输出文件名和路径
		const outRelPath = relPath.replace(
			/\.d\.ts$/,
			`.d.${outDtsExt}`,
		);
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
			// 移除 tsgo 生成的 sourceMappingURL（如果有）
			code = code.replace(
				/\/\/# sourceMappingURL=.*$/m,
				`//# sourceMappingURL=${path.basename(outFilePath)}.map`,
			);

			// 修正 d.ts.map 的 file 字段并写入
			const mapContent = await fs.readFile(mapFile, "utf-8");
			const sourceMap = JSON.parse(mapContent);
			sourceMap.file = path.basename(outFilePath);
			const outMapPath = outFilePath + ".map";
			await fs.mkdir(path.dirname(outMapPath), { recursive: true });
			await fs.writeFile(outMapPath, JSON.stringify(sourceMap));
		} else {
			// 无 sourcemap 时移除可能存在的 sourceMappingURL
			code = code.replace(/\/\/# sourceMappingURL=.*\n?$/m, "");
		}

		await fs.mkdir(path.dirname(outFilePath), { recursive: true });
		await fs.writeFile(outFilePath, code);

		const fileRelPath = dtsFile.replace(`${cwd}/`, "");
		const outFileRelPath = outFilePath.replace(`${cwd}/`, "");
		logger.info(
			"bundless(dts)",
			`${colors.yellow(fileRelPath)} to ${colors.blackBright(outFileRelPath)}`,
		);
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

	const tsconfigPath = ts.findConfigFile(cwd, ts.sys.fileExists);
	if (!tsconfigPath) {
		logger.error(`cannot find tsconfig.json in ${cwd}`);
		return;
	}

	const outJsExt = getOutJsExt(
		!!targets.node,
		pkg.type === "module",
		format,
	);
	const outDtsExt = outJsExt.replace(/^(c|m)?js$/, "$1ts");

	// 检查 tsconfig 中是否启用了 declarationMap
	const declarationMap = tsconfig?.declarationMap !== false;

	// 创建临时目录
	const tempDir = await fs.mkdtemp(
		path.join(tmpdir(), `lecp-tsgo-${format}-`),
	);

	try {
		await runTsgoCli({
			exePath,
			cwd,
			tsconfigPath,
			declarationDir: tempDir,
			rootDir: srcDir,
			declarationMap,
		});

		await postProcessTsgoOutput({
			tempDir,
			outDir,
			srcDir,
			outJsExt,
			outDtsExt,
			tsconfig: tsconfig ?? {},
			cwd,
		});

		onSuccess?.();
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}

	if (watch) {
		logger.warn(
			"tsgo builder does not support watch mode yet. DTS will only be generated on initial build.",
		);
	}
}
