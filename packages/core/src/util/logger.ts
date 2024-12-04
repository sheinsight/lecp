import pico from "picocolors";
import randomColor from "./random-color.ts";

/** 显示log级别: 默认 info(包含 error,info),  warn(包含 error), error, none 不显示 */
export type LogLevel = "verbose" | "info" | "warn" | "error" | "none";

// level权重
const logLevelWeight = { verbose: 0, info: 1, warn: 2, error: 3, none: 4 };

export type Logger = Record<
	Exclude<LogLevel, "none">,
	(...message: string[]) => void
> & {
	level: LogLevel;
};

export const createLogger = (
	name?: string,
	logLevel: LogLevel = "info",
): Logger => {
	let maxLevel = logLevel;

	const log = (type: LogLevel, ...msg: string[]) => {
		if ((logLevelWeight[logger.level] ?? 0) > logLevelWeight[type]) return;
		const namespace = name ? `${randomColor(`${name}`)}: ` : "";
		console.log(namespace, ...msg);
	};

	const logger = {
		verbose: (...msg: string[]) => log("info", ...msg),
		info: (...msg: string[]) => log("info", ...msg),
		warn: (...msg: string[]) =>
			log(
				"warn",
				pico.bgYellow(pico.white(" WARNING ")),
				...msg.map(pico.yellow),
			),
		error: (...msg: string[]) =>
			log("error", pico.bgRed(pico.white(" ERROR ")), ...msg.map(pico.red)),
	} as Logger;

	Object.defineProperty(logger, "level", {
		get: () => maxLevel,
		set(val: LogLevel) {
			maxLevel = val;
		},
	});

	return logger;
};

export const logger: Logger = createLogger();
