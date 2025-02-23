use environments::Environments;
use oxc_linter::{LintPlugins, Oxlintrc};
use rustc_hash::FxHashMap;
use serde::Deserialize;

pub mod environments;
pub mod rule_builder;
pub mod rules;

pub struct Linter {
    envs: Environments,
    plugins: LintPlugins,
}

// react-component
// react-component-esm
// react-component-commonjs

impl Linter {
    pub fn new(envs: Environments, plugins: LintPlugins) -> Self {
        Self { envs, plugins }
    }

    // pub fn with_rules(&mut self, rules: Vec<Box<dyn rules::Rule>>) -> Self {
    //     self
    // }

    // pub fn with_plugins(&mut self, plugins: LintPlugins) -> Self {
    //     self.plugins = plugins;
    //     self
    // }

    // pub fn with_env(&mut self, env: Environments) -> Self {
    //     self.envs = env;
    //     self
    // }

    pub fn build(&mut self) {
        // let env = OxlintEnv::deserialize(&serde_json::json!({
        //     "browser": true, "node": true, "es6": false
        // }))
        // .unwrap();

        let envs: FxHashMap<String, bool> = self.envs.to_hash_map();

        let oxlintrc = Oxlintrc::deserialize(serde_json::json!({
            // 存在跟框架绑定的规则
            "plugins": self.plugins,
            // 一次性配置整个类别的, 我们不需要用这个
            // "categories": todo!(),
            // "rules": todo!(),

            // 主要是上面 plugins 的一些额外配置
            // "settings": todo!(),
            "env": envs,

            // 他的 key 是动态的 ， 值必须是 readable、false | writeable、true | off
            // "globals": todo!(),
            // "overrides": todo!(),

            // Absolute path to the configuration file.
            // "path": todo!(),
            // "ignorePatterns": todo!(),
        }));

        // let oxlintrc = Oxlintrc {
        //     plugins: self.plugins,
        //     categories: todo!(),
        //     rules: todo!(),
        //     settings: todo!(),
        //     env: OxlintEnv(a),
        //     globals: todo!(),
        //     overrides: todo!(),
        //     path: todo!(),
        //     ignore_patterns: todo!(),
        // };

        // LinterBuilder::from_oxlintrc(true, oxlintrc);
    }
}
