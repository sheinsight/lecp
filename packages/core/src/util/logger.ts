import colors from "picocolors";
import randomColor from "./random-color.ts";

/** 显示log级别: 默认 info(包含 error,info),  warn(包含 error), error, none 不显示 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

// level权重
const logLevelWeight = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };

export type Logger = Record<
	Exclude<LogLevel, "none">,
	// TODO: fix any
	(...message: (any | string)[]) => void
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

		if (name) {
			console.log(`${randomColor(`${name}`)}: `, ...msg);
		} else {
			console.log(...msg);
		}
	};

	const logger = {
		debug: (...msg: any[]) => log("debug", ...msg),
		info: (...msg: any[]) => log("info", ...msg),
		warn: (...msg: string[]) =>
			log(
				"warn",
				colors.bgYellow(colors.white(" WARNING ")),
				...msg.map(colors.yellow),
			),
		error: (...msg: string[]) =>
			log(
				"error",
				colors.bgRed(colors.white(" ERROR ")),
				...msg.map(colors.red),
			),
	} as Logger;

	Object.defineProperty(logger, "level", {
		get: () => maxLevel,
		set(val: LogLevel) {
			// 同步设置 RUST env_logger 的环境变量(error,warn,info,debug,off)
			if (!process.env.LECP_LOG)
				process.env.LECP_LOG = val === "none" ? "off" : val;
			maxLevel = val;
		},
	});

	return logger;
};

export const logger: Logger = createLogger();
