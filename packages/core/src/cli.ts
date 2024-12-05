import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { build, init } from "./build.ts";
import { watchConfig } from "./restart.ts";

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
			const handler = async () => {
				const { config, files } = await init({
					cwd: process.cwd(),
					watch: argv.watch,
					logLevel: argv.logLevel,
				});

				build(config);

				if (argv.watch) {
					watchConfig(Array.from(files), handler);
				}
			};

			try {
				await handler();
			} catch (error) {
				// console.log(error);
			}
		},
	)
	.help()
	.version()
	.parse();
