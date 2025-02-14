import RspackChain from "rspack-chain";

export const stringify = RspackChain.toString as (
	config: unknown,
	options: { verbose?: boolean; configPrefix?: string },
) => string;
