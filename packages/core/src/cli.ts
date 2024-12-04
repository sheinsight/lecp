import yargs from "yargs";
import { hideBin } from "yargs/helpers";
// import build from "./build.ts";

yargs(hideBin(process.argv))
	.alias("v", "version")
	.alias("h", "help")
	.scriptName("lego-cp")
	.command(
		["$0", "build"],
		"执行编译打包",
		{
			watch: { alias: "w", boolean: true },
			logLevel: {
				type: "string",
				default: "info",
				choices: ["info", "warn", "error", "none"],
			},
		},
		argv => {
			console.log(argv);

			// build({
			// 	cwd: process.cwd(), // ?? find-up package.json
			// 	watch: argv.watch,
			// 	logLevel: argv.logLevel,
			// });
		},
	)
	.help()
	.version()
	.parse();
