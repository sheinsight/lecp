import chokidar from "chokidar";
import { debounce } from "./util/index.ts";

export function watchConfig(
	files: string[],
	callback: () => Promise<void> | void,
): void {
	const watcher = chokidar.watch(files, { ignoreInitial: true });

	const handler = debounce(async (file: string) => {
		console.log("配置改变", file.replace(process.cwd(), ""));
		await watcher.close();
		await callback();

		return 3;
	}, 300);

	watcher.on("add", handler).on("change", handler).on("unlink", handler);
}
