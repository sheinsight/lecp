mod transform;

use swc_core::ecma::ast::Program;
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};
use transform::transform_define;

#[plugin_transform]
fn process_transform(program: Program, data: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str(
        &data
            .get_transform_plugin_config()
            .expect("failed to get plugin config for plugin transform-define"),
    )
    .expect("invalid config for plugin transform-define");

    program.apply(transform_define(config))
}
