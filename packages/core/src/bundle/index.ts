import rspack, { type Compiler } from "@rspack/core";
import type { SystemConfig, Watcher } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import type { BundleFormat } from "../define-config.ts";
import { logger } from "../util/logger.ts";
import { getRspackConfig } from "./chain.ts";
import { stringify } from "./util.ts";

export type BundleOptions = Omit<FinalUserConfig, "format"> &
	Required<BundleFormat>;

type CallbackFunction = Parameters<Compiler["run"]>[0];
const compilerHandler: CallbackFunction = (err, stats) => {
	if (err || stats?.hasErrors()) {
		logger.error(err?.message || stats?.toString());
		return;
	}

	if (stats?.startTime && stats?.endTime) {
		console.log(`${(stats.endTime - stats.startTime) / 1000}s`);
	}
};

export const bundleFiles = async (
	options: BundleOptions,
	config: SystemConfig,
): Promise<Watcher | undefined> => {
	const { watch } = config;

	const rspackConfig = getRspackConfig(options, config);

	// console.log(stringify(rspackConfig, { verbose: true }));

	const compiler = rspack(rspackConfig);

	if (watch) {
		const { watcher } = compiler.watch({}, compilerHandler);
		return watcher;
	}

	// node@22.0.0
	// const { promise, resolve } = Promise.withResolvers<undefined>();
	return new Promise(resolve => {
		compiler.run((err, stats) => {
			// const fullConfig = compiler.options;
			// console.log("fullConfig", stringify(fullConfig, { verbose: true }));

			compilerHandler(err, stats);
			compiler.close(() => resolve(undefined));
		});
	});
};
