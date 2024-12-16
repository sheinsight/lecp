mod transform;

use swc_core::ecma::ast::Program;
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

use transform::init;

#[plugin_transform]
fn transform_extensions(program: Program, data: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str::<transform::Config>(
        &data
            .get_transform_plugin_config()
            .expect("failed to get plugin config for transform_extensions"),
    )
    .expect("invalid packages");

    program.apply(init(config))
}
