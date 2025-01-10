// use environments::Environments;
// use oxc_linter::{LintPlugins, LinterBuilder, Oxlintrc};
// use rustc_hash::FxHashMap;

pub mod environments;
// pub mod rules;

// pub struct Linter {
//     envs: Environments,
//     plugins: LintPlugins,
// }

// impl Linter {
//     pub fn new() -> Self {
//         Self {
//             envs: vec![],
//             plugins: LintPlugins::default(),
//         }
//     }

//     pub fn with_rules(&mut self, rules: Vec<Box<dyn rules::Rule>>) -> Self {
//         self
//     }

//     pub fn with_plugins(&mut self, plugins: LintPlugins) -> Self {
//         self.plugins = plugins;
//         self
//     }

//     pub fn with_env(&mut self, env: Environments) -> Self {
//         self.envs = env;
//         self
//     }

//     pub fn build(&mut self) -> Self {
//         let env = OxlintEnv::deserialize(&serde_json::json!({
//             "browser": true, "node": true, "es6": false
//         }))
//         .unwrap();

//         let a: FxHashMap<String, bool> = FxHashMap::default();

//         for env in self.envs {
//             a.insert(env.to_string(), true);
//         }

//         let oxlintrc = Oxlintrc {
//             plugins: self.plugins,
//             categories: todo!(),
//             rules: todo!(),
//             settings: todo!(),
//             env: OxlintEnv(a),
//             globals: todo!(),
//             overrides: todo!(),
//             path: todo!(),
//             ignore_patterns: todo!(),
//         };

//         LinterBuilder::from_oxlintrc(true, oxlintrc);
//         self
//     }
// }
