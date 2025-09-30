use swc_core::ecma::ast::Program;
use swc_core::plugin::plugin_transform;
use swc_core::plugin::proxies::TransformPluginProgramMetadata;
use swc_transform_shims::{Config, transform};

#[plugin_transform]
fn transform_plugin(program: Program, data: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str::<Config>(
        &data
            .get_transform_plugin_config()
            .expect("failed to get plugin config for transform-shims"),
    )
    .expect("invalid packages");

    program.apply(transform(config))
}
