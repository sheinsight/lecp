import type { SystemConfig, Watcher } from "../build.ts";
import type { FinalUserConfig } from "../config.ts";
import type { BundleFormat } from "../define-config.ts";

type BundleOptions = Omit<FinalUserConfig, "format"> & Required<BundleFormat>;

export const bundleFiles = async (
	options: BundleOptions,
	config: SystemConfig,
): Promise<Watcher[] | undefined> => {
	const { cwd, watch } = config;

	if (watch) {
		return [];
	}
};
