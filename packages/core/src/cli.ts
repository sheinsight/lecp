import colors from "picocolors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { build, init, type BuildResult } from "./build.ts";
import { watchConfig } from "./restart.ts";
import { measure } from "./util/index.ts";
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
				choices: ["debug", "info", "warn", "error", "none"],
			},
		},
		async argv => {
			let result: BuildResult | null = null;

			const handler = async () => {
				await result?.close();

				const systemConfig = { watch: argv.watch, logLevel: argv.logLevel };
				const { config, files } = await init(systemConfig);

				const { duration } = await measure(async () => {
					console.log(`\n${colors.white("LECP start build")}\n`);
					result = await build(config, systemConfig);
				});

				console.log(`\n🌈 build success in ${duration}ms`);

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
