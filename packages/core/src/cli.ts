import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { type Watcher, build, init } from "./build.ts";
import { watchConfig } from "./restart.ts";
import { logger } from "./util/logger.ts";

yargs(hideBin(process.argv))
	.alias("v", "version")
	.alias("h", "help")
	.scriptName("lecp")
	.command(
		["$0", "build"],
		"执行编译打包",
		{
			watch: { alias: "w", boolean: true },
			logLevel: {
				type: "string",
				default: "info",
				choices: ["verbose", "info", "warn", "error", "none"],
			},
		},
		async argv => {
			let watchers: Watcher[] = [];

			const handler = async () => {
				watchers?.forEach(watcher => watcher.close());

				const systemConfig = {
					cwd: process.cwd(),
					watch: argv.watch,
					logLevel: argv.logLevel,
				};

				const { config, files } = await init(systemConfig);

				watchers = await build(config, systemConfig);

				if (argv.watch) {
					watchConfig(Array.from(files), handler);
				}
			};

			try {
				await handler();
			} catch (error) {
				logger.error(error);
				// console.error(error);
				process.exit(1);
			}
		},
	)
	.help()
	.version()
	.parse();
