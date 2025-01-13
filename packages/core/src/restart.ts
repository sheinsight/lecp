import chokidar from "chokidar";
import { debounce } from "./util/index.ts";

export function watchConfig(
	files: string[],
	onUpdate: () => Promise<void> | void,
): void {
	const watcher = chokidar.watch(files, { ignoreInitial: true });

	const handler = debounce(async (event: unknown, file: string) => {
		console.log("配置改变", file.replace(process.cwd(), ""));
		await watcher.close();
		await onUpdate();
	}, 300);

	watcher.on("all", handler);
}
