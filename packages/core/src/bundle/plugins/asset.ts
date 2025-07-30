import type RspackChain from "rspack-chain";
import type { PluginFn } from "../chain.ts";

function addAssetRule(type: string, rule: RspackChain.Rule) {
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

export const pluginAsset: PluginFn = chain => {
	addAssetRule(
		"image",
		chain.module.rule("asset-image").test(/\.(png|jpe?g|gif|webp)$/i),
	);

	addAssetRule(
		"font",
		chain.module.rule("asset-font").test(/\.(woff|woff2|eot|ttf|otf)$/i),
	);
};
