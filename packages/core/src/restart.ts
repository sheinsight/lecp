import chokidar from "chokidar";
import { debounce } from "./util/index.ts";

function clearConsole(): void {
	process.stdout.write(
		process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H",
	);
}

export function watchConfig(
	files: string[],
	onUpdate: () => Promise<void> | void,
): void {
	const watcher = chokidar.watch(files, { ignoreInitial: true });

	const handler = debounce(async (event: unknown, file: string) => {
		clearConsole();
		console.log("配置改变", file.replace(process.cwd(), ""));
		await watcher.close();
		await onUpdate();
	}, 300);

	watcher.on("all", handler);
}
