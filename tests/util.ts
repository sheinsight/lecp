import fs from "node:fs/promises";
import path from "node:path";
import { build, init } from "@shined/lecp";
import { glob } from "tinyglobby";

export async function getOutputMap(
	outDir: string,
): Promise<Record<string, string>> {
	const files = await glob(path.join(outDir, "**/*"), { absolute: true });
	const map: Record<string, string> = {};
	await Promise.all(
		files.map(async file => {
			const relativePath = path.relative(outDir, file);
			map[relativePath] = await fs.readFile(file, "utf-8");
		}),
	);
	return map;
}

export async function runBuild(options: { cwd: string }) {
	const systemConfig = { cwd: options.cwd };
	const { config } = await init(systemConfig);
	await build(config, systemConfig);
}
