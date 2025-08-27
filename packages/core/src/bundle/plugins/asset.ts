import type RspackChain from "rspack-chain";
import { requireResolve } from "../../util/index.ts";
import type { PluginFn } from "../chain.ts";

function addAssetRule(
	type: string,
	rule: RspackChain.Rule | RspackChain.Rule<RspackChain.Rule>,
) {
	rule.oneOf(`asset-${type}-raw`).type("asset/source").resourceQuery(/raw/);
	rule.oneOf(`asset-${type}-url`).type("asset/resource").resourceQuery(/url/);
	rule
		.oneOf(`asset-${type}-inline`)
		.type("asset/inline")
		.resourceQuery(/inline/);
	rule
		.oneOf(`asset-${type}`)
		.type("asset")
		.parser({
			dataUrlCondition: {
				maxSize: 10 * 1024,
			},
		});
}

export const pluginAsset: PluginFn = (chain, { options }) => {
	addAssetRule(
		"image",
		chain.module.rule("asset-image").test(/\.(png|jpe?g|gif|webp)$/i),
	);

	addAssetRule(
		"font",
		chain.module.rule("asset-font").test(/\.(woff|woff2|eot|ttf|otf)$/i),
	);

	const svgRule = chain.module.rule("asset-svg").test(/\.svg$/i);

	const swcOptions = chain.module
		.rule("js")
		.uses.get("swc-loader")
		?.get("options");

	svgRule
		.oneOf("svg-react")
		.resourceQuery(/react|svgr/)
		.issuer(/\.[jt]sx?$/)
		.use("swc-loader")
		.loader("builtin:swc-loader")
		.options(swcOptions)
		.end()
		.use("svgr-loader")
		.loader(requireResolve("@svgr-rs/svgrs-plugin/webpack"))
		.options({
			jsxRuntime: options.react?.jsxRuntime,
			exportType: "named",
			namedExport: "ReactComponent",
		});

	addAssetRule("svg", svgRule.oneOf("svg-asset"));
};
